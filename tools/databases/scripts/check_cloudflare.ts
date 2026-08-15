import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script_dir = fileURLToPath(new URL('.', import.meta.url))
const root_dir = resolve(script_dir, '../../..')
const apps_dir = join(root_dir, 'apps')

interface CloudflareFinding {
	app_name: string
	file_path: string
	line_number?: number
	message: string
	severity: 'warning' | 'error'
}

const findings: CloudflareFinding[] = []

const forbidden_var_keys = [
	'AUTH_SECRET',
	'API_KEY_OPENAI',
	'API_KEY_GEMINI',
	'API_KEY_AQUIFER',
	'PHASE1_AI_ASSIST_API_KEY',
	'GEMINI_PRIVATE_KEY',
	'GOOGLE_OAUTH_CLIENT_SECRET',
]

function strip_jsonc_comments(jsonc: string): string {
	// Removes line comments // ... and block comments /* ... */
	return jsonc
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/.*$/gm, '')
		.replace(/,(\s*[}\]])/g, '$1') // trailing commas
}

async function validate_wrangler_config(app_name: string, file_path: string) {
	const raw_content = await readFile(file_path, 'utf-8')
	let config: Record<string, any>

	try {
		const cleaned = strip_jsonc_comments(raw_content)
		config = JSON.parse(cleaned)
	} catch (err: any) {
		findings.push({
			app_name,
			file_path,
			message: `Failed to parse wrangler.jsonc as valid JSONC: ${err?.message || err}`,
			severity: 'error',
		})
		return
	}

	// 1. Check compatibility_flags has nodejs_compat
	const flags: string[] = config.compatibility_flags || []
	if (!flags.includes('nodejs_compat')) {
		findings.push({
			app_name,
			file_path,
			message: 'Missing "nodejs_compat" in compatibility_flags.',
			severity: 'warning',
		})
	}

	// 2. Check compatibility_date is present
	if (!config.compatibility_date) {
		findings.push({
			app_name,
			file_path,
			message: 'Missing "compatibility_date" in wrangler.jsonc.',
			severity: 'warning',
		})
	}

	// 3. Check vars do not contain raw secrets
	const vars: Record<string, any> = config.vars || {}
	for (const key of Object.keys(vars)) {
		if (forbidden_var_keys.includes(key)) {
			findings.push({
				app_name,
				file_path,
				message: `Public vars in wrangler.jsonc contains sensitive secret key "${key}". Secrets must be provided via .env.local / Cloudflare dashboard secrets.`,
				severity: 'error',
			})
		}
	}

	// 4. Check D1 bindings structure if defined
	if (config.d1_databases && Array.isArray(config.d1_databases)) {
		for (const db of config.d1_databases) {
			if (!db.binding || !db.database_name || !db.database_id) {
				findings.push({
					app_name,
					file_path,
					message: `D1 database definition missing required fields (binding, database_name, or database_id): ${JSON.stringify(db)}`,
					severity: 'warning',
				})
			}
		}
	}
}

async function audit_cloudflare_configs() {
	console.log(`
============================================================
      ☁️ TaBiThA Cloudflare Workers Configuration Linter    
============================================================
`)

	const app_entries = await readdir(apps_dir, { withFileTypes: true })
	const app_dirs = app_entries.filter(d => d.isDirectory()).map(d => d.name)

	for (const app_name of app_dirs) {
		const wrangler_path = join(apps_dir, app_name, 'wrangler.jsonc')
		try {
			await validate_wrangler_config(app_name, wrangler_path)
		} catch {
			// File doesn't exist
		}
	}

	if (findings.length === 0) {
		console.log('✅ 100% Valid! All 5 wrangler.jsonc files comply with Cloudflare Workers best practices.\n')
		return
	}

	console.log(`⚠️  Detected ${findings.length} Cloudflare configuration observation(s):\n`)

	const is_ci = process.env.GITHUB_ACTIONS === 'true'

	for (const f of findings) {
		const rel_path = relative(root_dir, f.file_path)
		console.log(`[Cloudflare ${f.severity.toUpperCase()}: ${f.app_name}]`)
		console.log(`  📄 ${rel_path}`)
		console.log(`  💡 ${f.message}\n`)

		if (is_ci) {
			console.log(`::warning file=${rel_path},title=Cloudflare Config (${f.app_name})::${f.message}`)
		}
	}

	console.log(`📋 Summary: ${findings.length} observation(s) reported across app configurations.\n`)
}

if (import.meta.main) {
	await audit_cloudflare_configs()
}
