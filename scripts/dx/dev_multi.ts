import { createInterface } from 'node:readline/promises'
import { execFileSync, spawn } from 'node:child_process'
import { platform } from 'node:os'

type AppInfo = {
	id: string
	index: number
	pkg: string
	name: string
	port: number
	desc: string
	color: string	// ANSI color code for terminal output
}

export const APPS: Record<string, AppInfo> = {
	ontology: {
		id: 'ontology',
		index: 1,
		pkg: '@tabitha/ontology',
		name: 'Ontology',
		port: 3056,
		desc: 'Concepts, Senses, and Examples (D1)',
		color: '\x1b[32m', // green
	},
	targets: {
		id: 'targets',
		index: 2,
		pkg: '@tabitha/targets',
		name: 'Targets',
		port: 1382,
		desc: 'Target Language Text and Lexicon (D1)',
		color: '\x1b[33m', // yellow
	},
	sources: {
		id: 'sources',
		index: 3,
		pkg: '@tabitha/sources',
		name: 'Sources',
		port: 1947,
		desc: 'Biblical Source Text Encoding (D1)',
		color: '\x1b[34m', // blue
	},
	editor: {
		id: 'editor',
		index: 4,
		pkg: '@tabitha/editor',
		name: 'Editor',
		port: 1337,
		desc: 'Phase 1 Workbench & Checker',
		color: '\x1b[35m', // magenta
	},
	copilot: {
		id: 'copilot',
		index: 5,
		pkg: '@tabitha/copilot',
		name: 'Copilot',
		port: 9000,
		desc: 'AI Translation Guidance (Vertex / Gemini)',
		color: '\x1b[36m', // cyan
	},
	www: {
		id: 'www',
		index: 6,
		pkg: '@tabitha/www',
		name: 'Www',
		port: 1455,
		desc: 'Public Website & Marketing Site (Static)',
		color: '\x1b[31m', // red
	},
}

const COLOR_RESET = '\x1b[0m'

export async function run_dev_applications(app_keys: string[]) {
	const is_win = platform() === 'win32'
	const apps_to_run = app_keys.map(k => APPS[k]).filter(Boolean)
	
	if (apps_to_run.length === 0) {
		console.log('⚠️  No valid apps selected.')
		process.exit(0)
	}

	console.log(`
============================================================
🚀 Launching ${apps_to_run.length} Development Server(s)...
============================================================

Active Endpoints:`)
	for (const app of apps_to_run) {
		console.log(`  • ${app.name.padEnd(10)} http://localhost:${app.port} (${app.desc})`)
	}
	console.log('============================================================\n')
	console.log('Press q+Enter to exit\n')

	const app_processes = new Map<string, ReturnType<typeof spawn>>()
	let terminating = false

	for (const app of apps_to_run) {
		const args = ['--filter', app.pkg, 'dev']
		const child = spawn('bun', args, {
			env: process.env,
		})

		// Pipe stdout and stderr with color-coded prefixes
		const prefix = `${app.color}[${app.pkg}]${COLOR_RESET} `

		child.stdout?.on('data', data => {
			const lines = data.toString().trimEnd().split('\n')
			for (const line of lines) {
				console.log(`${prefix}${line}`)
			}
		})

		child.stderr?.on('data', data => {
			const lines = data.toString().trimEnd().split('\n')
			for (const line of lines) {
				console.error(`${prefix}${line}`)
			}
		})

		// If an app crashes unexpectedly, kill the rest to avoid orphaned services
		child.on('close', code => {
			console.log(`${prefix} server shutdown`)
			app_processes.delete(app.id)
			if (!terminating && code !== 0 && code !== null) {
				console.error(`${prefix} crashed with exit code ${code}. Shutting down all apps...`)
				terminate_apps()
			}
		})

		child.on('error', err => {
			console.error(`${prefix} Failed to start:`, err.message)
		})

		app_processes.set(app.id, child)
	}

	function terminate_apps() {
		console.log(`Terminating ${app_processes.size} apps...`)
		terminating = true

		for (const app_process of app_processes.values()) {
			if (is_win) {
				// Windows cmd intercepts the SIGINT itself (prompting "Terminate batch job (Y/N)?")
				// so we need to force kill the whole tree.
				try {
					execFileSync('taskkill', ['/pid', String(app_process.pid), '/t', '/f'])
				} catch {
					// Child may have already exited between the signal firing and taskkill running.
				}
			} else {
				app_process.kill('SIGINT')
			}
		}
		process.exit(0)
	}

	const rl = createInterface({ input: process.stdin, output: process.stdout })
	rl.on('line', line => {
		if (line === 'q') {
			terminate_apps()
		}
	})

	process.on('SIGINT', terminate_apps)
}

if (import.meta.main) {
	await run_dev_applications(Object.keys(APPS))
}