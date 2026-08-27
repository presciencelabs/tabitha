import { $ } from 'bun'
import { platform } from 'node:os'
import { load_database } from './db_load'
import { setup_env } from './setup_env'

async function check_sqlite_prerequisite(): Promise<boolean> {
	try {
		const sqlite_proc = await $`sqlite3 --version`.quiet()
		const sqlite_version = sqlite_proc.text().trim().split(' ')[0]
		console.log(`🗄️  SQLite3 Engine: v${sqlite_version} (verified!)\n`)
		return true
	} catch {
		const os_type = platform()
		console.error('\n❌ SQLite3 CLI (`sqlite3`) is required for local database bootstrapping but was not found in your PATH.')
		if (os_type === 'win32') {
			console.error('   👉 Install on Windows: winget install sqlite.sqlite (or choco install sqlite)\n')
		} else if (os_type === 'darwin') {
			console.error('   👉 Install on macOS: brew install sqlite\n')
		} else {
			console.error('   👉 Install on Linux: sudo apt-get install -y sqlite3\n')
		}
		return false
	}
}

async function setup_workspace() {
	console.log(`
============================================================
           🚀 Welcome to the TaBiThA Monorepo!              
============================================================
`)

	// 1. Setup local environment files
	await setup_env()

	// 2. Verify SQLite3 CLI prerequisite
	const sqlite_ready = await check_sqlite_prerequisite()
	if (!sqlite_ready) {
		console.warn('⚠️  Skipping database bootstrapping until SQLite3 CLI is installed.\n')
	}

	// 3. Configure Git pre-commit security hook & commit template
	try {
		await $`git config core.hooksPath .githooks`.quiet()
		await $`git config commit.template .gitmessage`.quiet()
		console.log('🔒 Configured Git pre-commit hook (.githooks) & commit template (.gitmessage)\n')
	} catch {
		// Non-git environment
	}

	// 4. Load latest SQLite / D1 databases
	if (sqlite_ready) {
		console.log('📦 Bootstrapping local D1 databases...')
		await load_database('all')
	}

	// 5. Run workspace verification
	console.log('🔍 Running initial workspace verification check...')
	try {
		await $`pnpm check`
		console.log('✅ Workspace checks passed cleanly!')
	} catch (err) {
		console.warn('⚠️  Verification encountered an issue:', err instanceof Error ? err.message : err)
	}

	console.log(`
============================================================
🎉 Setup Complete! You're ready to build with TaBiThA.

Local App Ports & Endpoints:
  • Ontology:  http://localhost:3056
  • Targets:   http://localhost:1382
  • Sources:   http://localhost:1947
  • Editor:    http://localhost:1337
  • Copilot:   http://localhost:9000

Useful Commands:
  • pnpm dev              Start all applications in parallel
  • pnpm dev:<app>        Start a single application (e.g. pnpm dev:ontology)
  • pnpm check            Run typecheck & linting across all packages
  • pnpm test:unit        Run all unit test suites
  • pnpm test:e2e         Run Playwright end-to-end tests
  • pnpm db:load          Reload all D1 databases from snapshots
  • pnpm db:grant <email> Grant yourself Ontology permissions locally (see below)

⚠️  Ontology only: after signing in with Google locally for the first time, a
   401 on /protected pages is expected -- your local Auth DB starts with no
   user grants. Fix it once with: pnpm db:grant your.email@example.com

🧪 60-Second Golden Path Smoke Test:
  1. Start all dev servers: \`pnpm dev\`
  2. Open Editor: http://localhost:1337
  3. Type 'Paul write-A a letter.' into the text box and click Check
  4. Click the 'write-A' token, then the 'write-A' link in the popup
     (navigates to Ontology at :3056)
  5. Expand any 'Usage Example' accordion in Ontology:
     • Verifies Sources (:1947) -> Fetches semantic tree
     • Verifies Targets (:1382) -> Fetches generated English text
============================================================
`)
}

if (import.meta.main) {
	await setup_workspace()
}
