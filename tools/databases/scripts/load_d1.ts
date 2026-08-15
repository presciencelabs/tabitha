import { readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'bun'

const script_dir = dirname(fileURLToPath(import.meta.url))
const root_dir = resolve(script_dir, '../../..')
const snapshots_dir = join(root_dir, 'tools/databases/snapshots')

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

function parse_wrangler_jsonc(file_path: string): { d1_databases?: Array<{ database_name: string }> } | null {
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

		for (const d1 of wrangler.d1_databases) {
			total_databases++
			const db_name = d1.database_name
			console.log(`⏳ Loading database "${db_name}" for ${app_key}...`)

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
				await $`npx wrangler d1 execute ${db_name} --local --file=${snapshot_file}`.cwd(config.app_dir)
				const duration = ((Date.now() - start_time) / 1000).toFixed(1)
				console.log(`   ✅ Loaded "${db_name}" successfully in ${duration}s!\n`)
				success_count++
			} catch (err: any) {
				console.error(`   ❌ Failed to execute wrangler for "${db_name}":`, err?.message || err)
			}
		}
	}

	console.log(`🎉 Finished loading ${success_count}/${total_databases} database(s) into local Wrangler environment.\n`)
}

if (import.meta.main) {
	const target = process.argv[2] || 'all'
	await load_database(target)
}
