import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script_dir = dirname(fileURLToPath(import.meta.url))
const root_dir = resolve(script_dir, '../../..')
const apps_dir = join(root_dir, 'apps')

const local_hosts: Record<string, string> = {
	PUBLIC_ONTOLOGY_API_HOST: 'http://localhost.tabitha.bible:5173',
	PUBLIC_TARGETS_API_HOST: 'http://localhost.tabitha.bible:8788',
	PUBLIC_SOURCES_API_HOST: 'http://localhost.tabitha.bible:8789',
	PUBLIC_EDITOR_API_HOST: 'http://localhost.tabitha.bible:8790',
	PUBLIC_COPILOT_API_HOST: 'http://localhost.tabitha.bible:8793',
}

function parse_env_file(content: string): Map<string, string> {
	const result = new Map<string, string>()
	const lines = content.split('\n')

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue

		const eq_idx = trimmed.indexOf('=')
		if (eq_idx === -1) continue

		const key = trimmed.slice(0, eq_idx).trim()
		const value = trimmed.slice(eq_idx + 1).trim()
		result.set(key, value)
	}

	return result
}

function generate_local_env_content(template_content: string, existing_content?: string): string {
	const existing_vars = existing_content ? parse_env_file(existing_content) : new Map<string, string>()
	const lines = template_content.split('\n')
	const output_lines: string[] = []

	for (const line of lines) {
		const trimmed = line.trim()

		// Preserve comments and empty lines
		if (!trimmed || trimmed.startsWith('#')) {
			output_lines.push(line)
			continue
		}

		const eq_idx = trimmed.indexOf('=')
		if (eq_idx === -1) {
			output_lines.push(line)
			continue
		}

		const key = trimmed.slice(0, eq_idx).trim()

		// Priority 1: If it's a known service host, point it to local port
		if (key in local_hosts) {
			output_lines.push(`${key}=${local_hosts[key]}`)
			continue
		}

		// Priority 2: If the developer already supplied a custom value in existing .env.local, preserve it
		if (existing_vars.has(key) && existing_vars.get(key) !== '') {
			output_lines.push(`${key}=${existing_vars.get(key)}`)
			continue
		}

		// Priority 3: Fall back to the template line
		output_lines.push(line)
	}

	return output_lines.join('\n')
}

export async function setup_env() {
	console.log('\n🔧 [TaBiThA Setup] Configuring local environment variables and service endpoints...\n')

	const app_dirs = readdirSync(apps_dir, { withFileTypes: true })
		.filter(d => d.isDirectory())
		.map(d => join(apps_dir, d.name))

	let configured_count = 0

	for (const app_path of app_dirs) {
		const app_name = app_path.replace(apps_dir + '/', '')
		const env_template = join(app_path, '.env')
		const env_local = join(app_path, '.env.local')

		if (!existsSync(env_template)) {
			console.log(`   ℹ️  ${app_name}: No .env template found (skipping).`)
			continue
		}

		const template_content = readFileSync(env_template, 'utf-8')
		const existing_content = existsSync(env_local) ? readFileSync(env_local, 'utf-8') : undefined

		const new_content = generate_local_env_content(template_content, existing_content)
		writeFileSync(env_local, new_content, 'utf-8')

		console.log(`   🔗 ${app_name}: Configured .env.local with local port discovery & preserved secrets.`)
		configured_count++
	}

	console.log(`\n🎉 Environment setup complete (${configured_count} .env.local file(s) wired to local dev servers).\n`)
}

if (import.meta.main) {
	await setup_env()
}
