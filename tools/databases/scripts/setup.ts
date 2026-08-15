import { lookup } from 'node:dns/promises'
import { platform } from 'node:os'
import { $ } from 'bun'
import { load_database } from './load_d1'
import { setup_env } from './setup_env'

async function check_local_domain() {
	console.log('🌐 Checking local domain mapping for localhost.tabitha.bible...')
	try {
		const { address } = await lookup('localhost.tabitha.bible')
		if (address === '127.0.0.1' || address === '::1') {
			console.log('   ✨ Domain mapping: localhost.tabitha.bible -> 127.0.0.1 (verified!)\n')
			return
		}
	} catch {
		// DNS resolution failed or unmapped
	}

	console.log('   ⚠️  "localhost.tabitha.bible" is not yet mapped in your local hosts file.')
	console.log('   To enable clean local OAuth redirects and cross-app links, add it to your hosts file:\n')

	const current_os = platform()
	if (current_os === 'win32') {
		console.log('   🪟 Windows (Run PowerShell as Administrator):')
		console.log('      Add-Content -Path C:\\Windows\\System32\\drivers\\etc\\hosts -Value "127.0.0.1 localhost.tabitha.bible"\n')
	} else {
		console.log('   🍎 macOS / 🐧 Linux (Terminal):')
		console.log('      echo "127.0.0.1 localhost.tabitha.bible" | sudo tee -a /etc/hosts\n')
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

	// 2. Verify local domain mapping
	await check_local_domain()

	// 3. Load latest SQLite / D1 databases
	console.log('📦 Bootstrapping local D1 databases...')
	await load_database('all')

	// 4. Run workspace verification
	console.log('🔍 Running initial workspace verification check...')
	try {
		await $`pnpm check`
		console.log('✅ Workspace checks passed cleanly!')
	} catch (err: any) {
		console.warn('⚠️  Verification encountered an issue:', err?.message || err)
	}

	console.log(`
============================================================
🎉 Setup Complete! You're ready to build with TaBiThA.

Local App Ports & Endpoints:
  • Ontology:  http://localhost.tabitha.bible:5173
  • Targets:   http://localhost.tabitha.bible:8788
  • Sources:   http://localhost.tabitha.bible:8789
  • Editor:    http://localhost.tabitha.bible:8790
  • Copilot:   http://localhost.tabitha.bible:8793

Useful Commands:
  • pnpm dev              Start all applications in parallel
  • pnpm dev:<app>        Start a single application (e.g. pnpm dev:ontology)
  • pnpm check            Run typecheck & linting across all packages
  • pnpm test:unit        Run all unit test suites
  • pnpm test:e2e         Run Playwright end-to-end tests
  • pnpm db:load          Reload all D1 databases from snapshots

🧪 60-Second Golden Path Smoke Test:
  1. Start all dev servers: \`pnpm dev\`
  2. Open Editor: http://localhost.tabitha.bible:8790/?text=Paul+write-01
  3. Click the 'write-01' concept card (navigates to Ontology at :5173)
  4. Expand any 'Usage Example' accordion in Ontology:
     • Verifies Sources (:8789) -> Fetches semantic tree
     • Verifies Targets (:8788) -> Fetches generated English text
============================================================
`)
}

if (import.meta.main) {
	await setup_workspace()
}
