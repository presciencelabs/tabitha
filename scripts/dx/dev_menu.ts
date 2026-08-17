import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { spawn } from 'node:child_process'

interface AppInfo {
	id: string
	pkg: string
	name: string
	port: number
	desc: string
}

const APPS: Record<string, AppInfo> = {
	ontology: {
		id: 'ontology',
		pkg: '@tabitha/ontology',
		name: 'Ontology',
		port: 5173,
		desc: 'Concepts, Senses, & Linguistic Rules (D1)',
	},
	targets: {
		id: 'targets',
		pkg: '@tabitha/targets',
		name: 'Targets',
		port: 8788,
		desc: 'Target Language Lexicon & Surface Forms (D1)',
	},
	sources: {
		id: 'sources',
		pkg: '@tabitha/sources',
		name: 'Sources',
		port: 8789,
		desc: 'Biblical Source Texts & Semantic Trees (D1)',
	},
	editor: {
		id: 'editor',
		pkg: '@tabitha/editor',
		name: 'Editor',
		port: 8790,
		desc: 'Translation Workbench & Rule Engine',
	},
	copilot: {
		id: 'copilot',
		pkg: '@tabitha/copilot',
		name: 'Copilot',
		port: 8793,
		desc: 'AI Translation Guidance (Vertex / Gemini)',
	},
}

interface Preset {
	name: string
	description: string
	apps: string[]
}

const PRESETS: Record<string, Preset> = {
	'1': {
		name: '🌟 All 5 Applications',
		description: 'Full stack environment',
		apps: ['ontology', 'targets', 'sources', 'editor', 'copilot'],
	},
	'2': {
		name: '✍️  Editor Workbench',
		description: 'Editor + Ontology knowledge base',
		apps: ['editor', 'ontology'],
	},
	'3': {
		name: '📚 Core Linguistics Engine',
		description: 'Ontology + Sources + Targets APIs',
		apps: ['ontology', 'sources', 'targets'],
	},
	'4': {
		name: '🤖 Copilot AI Lab',
		description: 'Copilot AI Assistant + Ontology',
		apps: ['copilot', 'ontology'],
	},
}

function print_menu() {
	console.log(`
============================================================
          🚀 TaBiThA Development Server Launcher
============================================================

Select a preset or custom selection:
  [1] 🌟 All 5 Applications      (Full Stack: Editor, Ontology, Sources, Targets, Copilot)
  [2] ✍️  Editor Workbench        (Editor + Ontology)
  [3] 📚 Core Linguistics Engine  (Ontology + Sources + Targets)
  [4] 🤖 Copilot AI Lab          (Copilot + Ontology)
  [5] 🎯 Custom Selection        (Pick individual apps)
  [0] ❌ Exit
`)
}

async function start_turbo_dev(selected_app_keys: string[]) {
	const selected_apps = selected_app_keys.map(k => APPS[k]).filter(Boolean)

	if (selected_apps.length === 0) {
		console.log('⚠️  No valid apps selected.')
		process.exit(0)
	}

	console.log(`
============================================================
🚀 Launching ${selected_apps.length} Development Server(s)...
============================================================

Active Endpoints:`)
	for (const app of selected_apps) {
		console.log(`  • ${app.name.padEnd(10)} http://localhost.tabitha.bible:${app.port} (${app.desc})`)
	}
	console.log('============================================================\n')

	const filter_args = selected_apps.flatMap(app => ['--filter', app.pkg])
	const args = ['run', 'dev', ...filter_args]

	const child = spawn('turbo', args, {
		stdio: 'inherit',
		env: process.env,
	})

	child.on('exit', code => {
		process.exit(code ?? 0)
	})
}

async function run_custom_selection(rl: ReturnType<typeof createInterface>): Promise<string[]> {
	console.log(`
Available Apps:
  [1] Ontology  (:5173) - ${APPS.ontology.desc}
  [2] Targets   (:8788) - ${APPS.targets.desc}
  [3] Sources   (:8789) - ${APPS.sources.desc}
  [4] Editor    (:8790) - ${APPS.editor.desc}
  [5] Copilot   (:8793) - ${APPS.copilot.desc}

Enter numbers separated by commas (e.g. 1,4 or 2,3,4):`)

	const answer = (await rl.question('👉 Your selection: ')).trim()
	const map: Record<string, string> = {
		'1': 'ontology',
		'2': 'targets',
		'3': 'sources',
		'4': 'editor',
		'5': 'copilot',
		ontology: 'ontology',
		targets: 'targets',
		sources: 'sources',
		editor: 'editor',
		copilot: 'copilot',
	}

	const chosen: string[] = []
	const tokens = answer.split(/[,\s]+/)
	for (const t of tokens) {
		const key = map[t.toLowerCase()]
		if (key && !chosen.includes(key)) {
			chosen.push(key)
		}
	}

	return chosen
}

export async function run_dev_menu() {
	if (!process.stdin.isTTY) {
		// Non-interactive environment, launch all
		await start_turbo_dev(PRESETS['1'].apps)
		return
	}

	const rl = createInterface({ input, output })

	try {
		print_menu()
		const choice = (await rl.question('👉 Enter selection [0-5] (default: 1): ')).trim() || '1'

		if (choice === '0' || choice.toLowerCase() === 'exit' || choice.toLowerCase() === 'q') {
			console.log('👋 Bye!')
			rl.close()
			process.exit(0)
		}

		if (choice === '5') {
			const custom_apps = await run_custom_selection(rl)
			rl.close()
			await start_turbo_dev(custom_apps)
			return
		}

		const preset = PRESETS[choice]
		if (preset) {
			rl.close()
			await start_turbo_dev(preset.apps)
			return
		}

		console.log(`⚠️  Invalid choice "${choice}". Defaulting to All Applications.`)
		rl.close()
		await start_turbo_dev(PRESETS['1'].apps)
	} catch {
		rl.close()
	}
}

if (import.meta.main) {
	await run_dev_menu()
}
