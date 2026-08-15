import { $ } from 'bun'
import { load_database } from './load_d1'
import { setup_env } from './setup_env'

async function setup_workspace() {
	console.log(`
============================================================
           🚀 Welcome to the TaBiThA Monorepo!              
============================================================
`)

	// 1. Setup local environment files
	await setup_env()

	// 2. Load latest SQLite / D1 databases
	console.log('📦 Bootstrapping local D1 databases...')
	await load_database('all')

	// 3. Run workspace verification
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
  • pnpm db:load          Reload all D1 databases from snapshots
============================================================
`)
}

if (import.meta.main) {
	await setup_workspace()
}
