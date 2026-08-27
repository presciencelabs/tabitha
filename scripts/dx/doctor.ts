import { existsSync, readdirSync } from 'node:fs'
import { platform } from 'node:os'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import { $ } from 'bun'
import { check_cloudflare_configs } from '../audits/check_cloudflare'
import { sync_readme_badges } from '../audits/check_readme_badges'
import { scan_secrets } from '../audits/check_secrets'

type DiagnosticResult = {
	category: string
	name: string
	status: 'PASS' | 'WARN' | 'FAIL'
	message: string
	fix?: string
}

const APPS = [
	{ name: 'ontology', port: 3056, has_db: true, table: 'Concepts' },
	{ name: 'targets', port: 1382, has_db: true, table: 'Text' },
	{ name: 'sources', port: 1947, has_db: true, table: 'Sources' },
	{ name: 'editor', port: 1337, has_db: false },
	{ name: 'copilot', port: 9000, has_db: false },
]

async function check_runtimes(): Promise<DiagnosticResult[]> {
	const results: DiagnosticResult[] = []

	// 1. Node.js
	try {
		const node_proc = await $`node -v`.quiet()
		const node_version = node_proc.text().trim()
		const major = parseInt(node_version.replace(/^v/, '').split('.')[0], 10)
		if (major >= 22) {
			results.push({
				category: 'Runtimes',
				name: 'Node.js Engine',
				status: 'PASS',
				message: `${node_version} (>= v22 required)`,
			})
		} else {
			results.push({
				category: 'Runtimes',
				name: 'Node.js Engine',
				status: 'FAIL',
				message: `${node_version} (v22+ required)`,
				fix: 'Install Node.js 22+ using nvm, fnm, or volta',
			})
		}
	} catch {
		results.push({
			category: 'Runtimes',
			name: 'Node.js Engine',
			status: 'FAIL',
			message: 'Not found in PATH',
			fix: 'Install Node.js 22+ from https://nodejs.org',
		})
	}

	// 2. Bun
	try {
		const bun_proc = await $`bun -v`.quiet()
		const bun_version = bun_proc.text().trim()
		results.push({
			category: 'Runtimes',
			name: 'Bun Runtime',
			status: 'PASS',
			message: `v${bun_version}`,
		})
	} catch {
		results.push({
			category: 'Runtimes',
			name: 'Bun Runtime',
			status: 'FAIL',
			message: 'Not found in PATH',
			fix: 'Install Bun from https://bun.sh (`curl -fsSL https://bun.sh/install | bash`)',
		})
	}

	// 3. pnpm
	try {
		const pnpm_proc = await $`pnpm -v`.quiet()
		const pnpm_version = pnpm_proc.text().trim()
		results.push({
			category: 'Runtimes',
			name: 'pnpm Package Manager',
			status: 'PASS',
			message: `v${pnpm_version}`,
		})
	} catch {
		results.push({
			category: 'Runtimes',
			name: 'pnpm Package Manager',
			status: 'FAIL',
			message: 'Not found in PATH',
			fix: 'Install pnpm via corepack (`corepack enable && corepack prepare pnpm@latest --activate`)',
		})
	}

	// 4. SQLite3 CLI
	try {
		const sqlite_proc = await $`sqlite3 --version`.quiet()
		const sqlite_version = sqlite_proc.text().trim().split(' ')[0]
		results.push({
			category: 'Runtimes',
			name: 'SQLite3 Engine',
			status: 'PASS',
			message: `v${sqlite_version}`,
		})
	} catch {
		const os_type = platform()
		const sqlite_fix = os_type === 'win32'
			? 'Install SQLite via winget (`winget install sqlite.sqlite`) or chocolatey (`choco install sqlite`)'
			: os_type === 'darwin'
				? 'Install SQLite via Homebrew (`brew install sqlite`) or Xcode Command Line Tools'
				: 'Install SQLite via apt (`sudo apt-get install sqlite3`)'

		results.push({
			category: 'Runtimes',
			name: 'SQLite3 Engine',
			status: 'FAIL',
			message: 'Not found in PATH',
			fix: sqlite_fix,
		})
	}

	return results
}

async function check_env_files(): Promise<DiagnosticResult[]> {
	const results: DiagnosticResult[] = []
	const missing_apps = APPS
		.filter(app => !existsSync(join(process.cwd(), 'apps', app.name, '.env.local')))
		.map(app => app.name)

	if (missing_apps.length === 0) {
		results.push({
			category: 'Environment',
			name: 'App .env.local Files',
			status: 'PASS',
			message: 'All 5 applications configured with local service endpoints',
		})
	} else {
		results.push({
			category: 'Environment',
			name: 'App .env.local Files',
			status: 'WARN',
			message: `Missing in: ${missing_apps.join(', ')}`,
			fix: 'Run `pnpm setup:env` to generate local environment configs',
		})
	}

	return results
}

function find_sqlite_file(base_dir: string): string | null {
	if (!existsSync(base_dir)) return null
	try {
		const entries = readdirSync(base_dir, { withFileTypes: true, recursive: true })
		for (const entry of entries) {
			if (entry.isFile() && entry.name.endsWith('.sqlite') && !entry.name.includes('metadata')) {
				return join(entry.parentPath || base_dir, entry.name)
			}
		}
	} catch {
		return null
	}
	return null
}

async function check_local_databases(): Promise<DiagnosticResult[]> {
	const results: DiagnosticResult[] = []

	for (const app of APPS) {
		if (!app.has_db || !app.table) continue

		const d1_dir = join(process.cwd(), 'apps', app.name, '.wrangler', 'state', 'v3', 'd1')
		const sqlite_path = find_sqlite_file(d1_dir)

		if (!sqlite_path) {
			results.push({
				category: 'Local Databases',
				name: `D1 Database (${app.name})`,
				status: 'WARN',
				message: 'No local SQLite database found in .wrangler state',
				fix: `Run \`pnpm db:load\` or \`bun tools/databases/src/load_d1.ts ${app.name}\``,
			})
			continue
		}

		try {
			const db = new Database(sqlite_path)
			const count_res = db.query(`SELECT count(*) as count FROM ${app.table}`).get() as { count: number } | null
			db.close()

			const count = count_res?.count ?? 0
			if (count > 0) {
				results.push({
					category: 'Local Databases',
					name: `D1 Database (${app.name})`,
					status: 'PASS',
					message: `Loaded (${count.toLocaleString()} rows in '${app.table}')`,
				})
			} else {
				results.push({
					category: 'Local Databases',
					name: `D1 Database (${app.name})`,
					status: 'WARN',
					message: `Database exists but table '${app.table}' has 0 rows`,
					fix: 'Run `pnpm db:load` to populate tables',
				})
			}
		} catch (err) {
			results.push({
				category: 'Local Databases',
				name: `D1 Database (${app.name})`,
				status: 'WARN',
				message: `Error querying SQLite: ${err instanceof Error ? err.message : err}`,
				fix: 'Run `pnpm db:load` to re-bootstrap SQLite snapshot',
			})
		}
	}

	return results
}

async function check_security_and_cloudflare(): Promise<DiagnosticResult[]> {
	const results: DiagnosticResult[] = []

	// 1. Secrets Scanner
	try {
		const secret_res = await scan_secrets()
		if (secret_res.found === 0) {
			results.push({
				category: 'Quality & Security',
				name: 'Credential & Secret Scanner',
				status: 'PASS',
				message: `${secret_res.scanned} files scanned, 0 secrets detected`,
			})
		} else {
			results.push({
				category: 'Quality & Security',
				name: 'Credential & Secret Scanner',
				status: 'FAIL',
				message: `${secret_res.found} potential secret(s) found in repository!`,
				fix: 'Run `pnpm check:secrets` for line-by-line inspection',
			})
		}
	} catch (err) {
		results.push({
			category: 'Quality & Security',
			name: 'Credential & Secret Scanner',
			status: 'WARN',
			message: `Could not run scanner: ${err instanceof Error ? err.message : err}`,
		})
	}

	// 2. Cloudflare Configs Linter
	try {
		const cf_res = await check_cloudflare_configs()
		if (cf_res.valid) {
			results.push({
				category: 'Quality & Security',
				name: 'Cloudflare Wrangler Configs',
				status: 'PASS',
				message: '5/5 wrangler.jsonc configurations valid',
			})
		} else {
			results.push({
				category: 'Quality & Security',
				name: 'Cloudflare Wrangler Configs',
				status: 'FAIL',
				message: `${cf_res.errors.length} configuration error(s) found`,
				fix: 'Run `pnpm check:cloudflare` for details',
			})
		}
	} catch (err) {
		results.push({
			category: 'Quality & Security',
			name: 'Cloudflare Wrangler Configs',
			status: 'WARN',
			message: `Could not check Cloudflare configs: ${err instanceof Error ? err.message : err}`,
		})
	}

	// 3. README Badges Sync
	try {
		const badge_res = await sync_readme_badges({ should_write: false })
		if (badge_res.is_synced) {
			results.push({
				category: 'Quality & Security',
				name: 'README Badges Sync',
				status: 'PASS',
				message: 'All README badges in sync with package.json',
			})
		} else {
			results.push({
				category: 'Quality & Security',
				name: 'README Badges Sync',
				status: 'FAIL',
				message: `${badge_res.findings.length} badge(s) out of sync with package.json`,
				fix: 'Run `bun scripts/audits/check_readme_badges.ts --fix` to sync badges',
			})
		}
	} catch (err) {
		results.push({
			category: 'Quality & Security',
			name: 'README Badges Sync',
			status: 'WARN',
			message: `Could not check README badges: ${err instanceof Error ? err.message : err}`,
		})
	}

	return results
}

export async function run_doctor(): Promise<{ all_passed: boolean; fixes: string[] }> {
	console.log(`
============================================================
              🩺 TaBiThA Monorepo Doctor
============================================================
`)

	const results: DiagnosticResult[] = [
		...await check_runtimes(),
		...await check_env_files(),
		...await check_local_databases(),
		...await check_security_and_cloudflare(),
	]

	// Group by category
	const categories = [...new Set(results.map(r => r.category))]
	const fixes: { name: string; fix: string }[] = []

	for (const cat of categories) {
		console.log(`📌 ${cat}:`)
		const cat_results = results.filter(r => r.category === cat)
		for (const r of cat_results) {
			const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌'
			console.log(`   ${icon} ${r.name.padEnd(30)} ${r.message}`)
			if (r.fix) {
				fixes.push({ name: r.name, fix: r.fix })
			}
		}
		console.log('')
	}

	const pass_count = results.filter(r => r.status === 'PASS').length
	const warn_count = results.filter(r => r.status === 'WARN').length
	const fail_count = results.filter(r => r.status === 'FAIL').length

	console.log('============================================================')
	console.log(`Diagnostic Summary: ${pass_count} Passed | ${warn_count} Warnings | ${fail_count} Failed`)

	if (fixes.length > 0) {
		console.log('\n💡 Recommended Actions:')
		for (const f of fixes) {
			console.log(`   • ${f.name}:`)
			console.log(`     👉 ${f.fix}`)
		}
	} else {
		console.log('\n✨ Everything is healthy and configured! You are ready to build.')
	}
	console.log('============================================================\n')

	return {
		all_passed: fail_count === 0,
		fixes: fixes.map(f => f.fix),
	}
}

if (import.meta.main) {
	const { all_passed } = await run_doctor()
	if (!all_passed) {
		process.exit(1)
	}
}
