import { readdir } from 'node:fs/promises'
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash, randomBytes } from 'node:crypto'
import { execSync } from 'node:child_process'
import { strip_jsonc_comments } from '../../packages/types/src/index'

const script_dir = dirname(fileURLToPath(import.meta.url))
const root_dir = resolve(script_dir, '../..')
const snapshots_dir = join(root_dir, 'tools/databases/snapshots')
const workerd_hash_cache_path = join(root_dir, 'tools/databases/.d1-workerd-hash-cache.json')

interface D1DatabaseEntry {
	binding?: string
	database_name: string
	database_id: string
}

interface AppConfig {
	app_dir: string
	wrangler_path: string
}

const apps_config: Record<string, AppConfig> = {
	ontology: {
		app_dir: join(root_dir, 'apps/ontology'),
		wrangler_path: join(root_dir, 'apps/ontology/wrangler.jsonc'),
	},
	sources: {
		app_dir: join(root_dir, 'apps/sources'),
		wrangler_path: join(root_dir, 'apps/sources/wrangler.jsonc'),
	},
	targets: {
		app_dir: join(root_dir, 'apps/targets'),
		wrangler_path: join(root_dir, 'apps/targets/wrangler.jsonc'),
	},
}

function parse_wrangler_jsonc(file_path: string): { d1_databases?: D1DatabaseEntry[] } | null {
	if (!existsSync(file_path)) return null
	const content = readFileSync(file_path, 'utf-8')
	const cleaned = strip_jsonc_comments(content)
	return JSON.parse(cleaned)
}

async function find_latest_snapshot(prefix: string): Promise<string | null> {
	if (!existsSync(snapshots_dir)) return null
	const entries = await readdir(snapshots_dir)
	const matching = entries
		.filter(f => f.startsWith(prefix) && f.endsWith('.sql'))
		.sort()
	return matching.length > 0 ? join(snapshots_dir, matching[matching.length - 1]) : null
}

function read_workerd_hash_cache(): Record<string, string> {
	if (!existsSync(workerd_hash_cache_path)) return {}
	try {
		return JSON.parse(readFileSync(workerd_hash_cache_path, 'utf-8'))
	} catch {
		return {}
	}
}

function write_workerd_hash_cache(cache: Record<string, string>) {
	writeFileSync(workerd_hash_cache_path, JSON.stringify(cache, null, '\t') + '\n')
}

// Miniflare's local D1 storage is a Durable Object (uniqueKey "miniflare-D1DatabaseObject" for every
// database) whose on-disk file name comes from workerd's native idFromName(database_id) derivation --
// an internal, undocumented algorithm with no JS-reachable implementation. Rather than guess it, boot
// the app's own installed wrangler via getPlatformProxy() (the same mechanism vite dev/adapter-cloudflare
// use) and write a uniquely-named marker table through each binding, then scan the state dir's existing
// .sqlite files to see which one picked it up. (A "which file is new" diff doesn't work here: the real
// file is almost always already sitting in the state dir from a previous `vite dev` run.)
async function resolve_workerd_hashes(
	config: AppConfig,
	entries: D1DatabaseEntry[],
	d1_state_dir: string,
): Promise<Record<string, string>> {
	const require_from_app = createRequire(join(config.app_dir, 'package.json'))
	const wrangler_entry = require_from_app.resolve('wrangler')
	const { getPlatformProxy } = await import(pathToFileURL(wrangler_entry).href)

	const proxy = await getPlatformProxy({
		configPath: config.wrangler_path,
		// getPlatformProxy()'s default persist path is relative to process.cwd(), not to configPath's
		// directory -- since this script always runs from the repo root, that default would silently
		// create/read a separate, wrong `.wrangler/state` at the repo root instead of the app's own.
		persist: { path: join(config.app_dir, '.wrangler', 'state', 'v3') },
	})
	const resolved: Record<string, string> = {}
	try {
		for (const d1 of entries) {
			if (!d1.binding) continue
			const marker = `_tabitha_resolve_${randomBytes(8).toString('hex')}`
			await proxy.env[d1.binding].exec(`CREATE TABLE "${marker}" (x INTEGER);`)

			const candidates = existsSync(d1_state_dir)
				? (await readdir(d1_state_dir)).filter(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
				: []
			const match = candidates.find(f => {
				try {
					const found = execSync(
						`sqlite3 "${join(d1_state_dir, f)}" "SELECT name FROM sqlite_master WHERE type='table' AND name='${marker}';"`,
						{ encoding: 'utf-8' },
					).trim()
					return found === marker
				} catch {
					return false
				}
			})
			if (!match) {
				console.warn(`   ⚠️  Could not resolve Miniflare storage file for binding "${d1.binding}"`)
				continue
			}
			resolved[d1.database_id] = match.slice(0, -'.sqlite'.length)
		}
	} finally {
		await proxy.dispose()
	}
	return resolved
}

function import_sqlite_snapshot(snapshot_file: string, target_db: string) {
	// Clean previous database & journal files if present
	for (const path of [target_db, `${target_db}-wal`, `${target_db}-shm`]) {
		if (existsSync(path)) unlinkSync(path)
	}

	const pragma_header = 'PRAGMA synchronous = OFF; PRAGMA journal_mode = MEMORY; PRAGMA cache_size = 100000; BEGIN TRANSACTION;'
	const pragma_footer = 'COMMIT;'
	execSync(`(echo "${pragma_header}"; cat "${snapshot_file}"; echo "${pragma_footer}") | sqlite3 "${target_db}"`, {
		stdio: 'pipe',
		maxBuffer: 1024 * 1024 * 50,
	})
}

export async function load_database(target_app: string = 'all') {
	const apps_to_process = target_app === 'all' ? Object.keys(apps_config) : [target_app]

	console.log(`\n🗄️  [TaBiThA DB Loader] Loading local SQLite/D1 database(s) for: ${apps_to_process.join(', ')}...\n`)

	let success_count = 0
	let total_databases = 0

	for (const app_key of apps_to_process) {
		const config = apps_config[app_key]
		if (!config) {
			console.error(`❌ Unknown app target: "${app_key}". Available: ${Object.keys(apps_config).join(', ')}`)
			process.exit(1)
		}

		const wrangler = parse_wrangler_jsonc(config.wrangler_path)
		if (!wrangler?.d1_databases || wrangler.d1_databases.length === 0) {
			console.warn(`⚠️  No d1_databases found in ${config.wrangler_path}`)
			continue
		}

		const d1_state_dir = join(config.app_dir, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')
		mkdirSync(d1_state_dir, { recursive: true })

		// Initialize Miniflare metadata.sqlite if missing
		const metadata_db_path = join(d1_state_dir, 'metadata.sqlite')
		if (!existsSync(metadata_db_path)) {
			execSync(`sqlite3 "${metadata_db_path}" "CREATE TABLE IF NOT EXISTS _cf_ALARM (actor_id TEXT PRIMARY KEY, scheduled_time INTEGER, actor_name TEXT) WITHOUT ROWID;"`, {
				stdio: 'ignore',
			})
		}

		const workerd_hash_cache = read_workerd_hash_cache()
		const needs_resolution = wrangler.d1_databases.filter(d1 => {
			const cached = workerd_hash_cache[d1.database_id]
			return !cached || !existsSync(join(d1_state_dir, `${cached}.sqlite`))
		})
		if (needs_resolution.length > 0) {
			console.log(`   🔍 Resolving Miniflare storage file(s) for: ${needs_resolution.map(d => d.binding || d.database_name).join(', ')}...`)
			const resolved = await resolve_workerd_hashes(config, needs_resolution, d1_state_dir)
			Object.assign(workerd_hash_cache, resolved)
			write_workerd_hash_cache(workerd_hash_cache)
		}

		for (const d1 of wrangler.d1_databases) {
			total_databases++
			const db_name = d1.database_name
			const db_id = d1.database_id
			console.log(`⏳ Loading database "${db_name}" (${db_id}) for ${app_key}...`)

			let snapshot_file = join(snapshots_dir, `${db_name}.tabitha.sqlite.sql`)
			if (!existsSync(snapshot_file)) {
				const prefix = db_name.split('_')[0]
				const found = await find_latest_snapshot(prefix)
				if (found) snapshot_file = found
			}

			if (!snapshot_file || !existsSync(snapshot_file)) {
				console.error(`❌ Could not find snapshot file for "${db_name}" in ${snapshots_dir}`)
				continue
			}

			const display_snapshot = snapshot_file.replace(root_dir + '/', '')
			console.log(`   📄 Using snapshot: ${display_snapshot}`)

			const start_time = Date.now()
			try {
				const db_hash = createHash('sha256').update(db_id).digest('hex')
				const target_db = join(d1_state_dir, `${db_hash}.sqlite`)

				import_sqlite_snapshot(snapshot_file, target_db)

				// Mirror database file to all possible hash formats (id, name, binding, prefix)
				const alternate_keys = [
					db_name,
					d1.binding || '',
					db_name.split('_')[0],
				].filter(k => Boolean(k && k !== db_id))

				function copy_database_safely(src: string, dest: string) {
					if (src === dest) return
					for (const ext of ['', '-wal', '-shm']) {
						const p = `${dest}${ext}`
						if (existsSync(p)) unlinkSync(p)
					}
					copyFileSync(src, dest)
				}

				for (const key of alternate_keys) {
					const alt_hash = createHash('sha256').update(key).digest('hex')
					const alt_db_path = join(d1_state_dir, `${alt_hash}.sqlite`)
					copy_database_safely(target_db, alt_db_path)
				}

				const workerd_hash = workerd_hash_cache[db_id]
				if (workerd_hash) {
					const workerd_db_path = join(d1_state_dir, `${workerd_hash}.sqlite`)
					copy_database_safely(target_db, workerd_db_path)
				}

				const table_count_str = execSync(`sqlite3 "${target_db}" "SELECT count(*) FROM sqlite_master WHERE type='table';"`, { encoding: 'utf-8' }).trim()
				const table_count = parseInt(table_count_str, 10) || 0
				if (table_count === 0) {
					throw new Error(`Database "${db_name}" imported with 0 tables: ${target_db}`)
				}

				const duration = ((Date.now() - start_time) / 1000).toFixed(2)
				console.log(`   ⚡ Loaded "${db_name}" (${table_count} tables) in ${duration}s (-> ${db_hash.slice(0, 12)}...sqlite)!\n`)
				success_count++
			} catch (err: any) {
				console.error(`   ❌ Failed to load "${db_name}":`, err?.message || err)
			}
		}
	}

	console.log(`🎉 Finished loading ${success_count}/${total_databases} database(s) into local Wrangler environment.\n`)

	if (success_count < total_databases) {
		console.error(`❌ Failed to load all databases (${success_count}/${total_databases} succeeded).`)
		process.exit(1)
	}
}

if (import.meta.main) {
	const target = process.argv[2] || 'all'
	await load_database(target)
}
