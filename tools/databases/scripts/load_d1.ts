import { readdir } from 'node:fs/promises'
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'

const script_dir = dirname(fileURLToPath(import.meta.url))
const root_dir = resolve(script_dir, '../../..')
const snapshots_dir = join(root_dir, 'tools/databases/snapshots')

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
	const cleaned = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
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

				/**
				 * ARCHITECTURAL CONTEXT, RISKS & TRADE-OFFS:
				 *
				 * 1. The Core Trade-off (Snapshots vs. Synthetic Seed Fixtures):
				 *    - Direct SQLite file mapping is an inherently higher-risk approach because
				 *      it relies on Miniflare/workerd internal state paths rather than a public JS API.
				 *    - However, this approach won out over synthetic fixtures because TaBiThA E2E tests
				 *      validate complex grammatical encodings, Hebrew/Greek lexicons, and queries spanning
				 *      all 66 Bible books and 20+ ontology tables. Hand-crafted mock seeds would rot quickly,
				 *      require constant manual updates whenever schemas or query shapes change, and lack
				 *      real-world edge cases.
				 *    - Snapshot loading is also orders of magnitude faster (1.4s vs multi-second IPC queries).
				 *
				 * 2. Miniflare / workerd Durable Object ID Resolution:
				 *    Cloudflare's `workerd` runtime assigns a deterministic DO ID for each D1 binding via
				 *    `idFromName(binding_name)`. Since binding names ('DB_Targets', 'DB_Sources',
				 *    'DB_Ontology', 'DB_Auth') remain constant across database snapshot updates, these
				 *    hashes are stable and mapped below by binding prefix ('Targets', 'Sources', etc.).
				 *    `copy_database_safely` unlinks any pre-existing `-wal` and `-shm` lock files on copy
				 *    to prevent `SQLITE_BUSY` transaction header mismatches.
				 *
				 * 3. Risk Mitigation via Automated CI Pre-Flight Verification:
				 *    To protect against potential future Wrangler/Miniflare internal changes, CI runs an
				 *    explicit pre-flight validation check (`SELECT count(*) FROM sqlite_master WHERE type='table'`)
				 *    asserting that all `.wrangler/state` SQLite databases contain active tables before
				 *    Playwright boots. Any breaking change in Miniflare's storage scheme fails fast in CI.
				 */
				const known_workerd_hashes: Record<string, string> = {
					'Targets': '2d5f513e6b9e5b68d83ec617ff25803295d2a2106bd2a797052b5b82015a040a',
					'Sources': '7ffa3fdd72032bbd696dd3d8682a80bbf4f3c9c03c71d125a2238239e2fe6bce',
					'Ontology': '7f0590b8bc24ed7dd19340f22195c999e7128818bf7529ba1b9a0c0dad3c0a34',
					'Auth': '181ea28918b1425c38047bc6e0c62f50d16f238f1931aa5b25ebaf6e085a4c5b',
				}

				const prefix = db_name.split('_')[0]
				const workerd_hash = known_workerd_hashes[prefix]
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
