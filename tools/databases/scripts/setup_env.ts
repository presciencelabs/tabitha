import { copyFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script_dir = dirname(fileURLToPath(import.meta.url))
const root_dir = resolve(script_dir, '../../..')
const apps_dir = join(root_dir, 'apps')

export async function setup_env() {
	console.log('\n🔧 [TaBiThA Setup] Configuring local environment variables...\n')

	const app_dirs = readdirSync(apps_dir, { withFileTypes: true })
		.filter(d => d.isDirectory())
		.map(d => join(apps_dir, d.name))

	let created_count = 0

	for (const app_path of app_dirs) {
		const app_name = app_path.replace(apps_dir + '/', '')
		const env_example = join(app_path, '.env')
		const env_local = join(app_path, '.env.local')

		if (existsSync(env_local)) {
			console.log(`   ✨ ${app_name}: .env.local already exists (preserving custom configuration).`)
		} else if (existsSync(env_example)) {
			copyFileSync(env_example, env_local)
			console.log(`   📄 ${app_name}: Created .env.local from .env template.`)
			created_count++
		} else {
			console.log(`   ℹ️  ${app_name}: No .env template found (skipping).`)
		}
	}

	console.log(`\n🎉 Environment setup complete (${created_count} new .env.local file(s) created).\n`)
}

if (import.meta.main) {
	await setup_env()
}
