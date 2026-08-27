import { PORTS } from '../../packages/vite-config/ports.js'

const BANNER = 'GnOvGuN Cbeg Trzngevn'
const SIGNATURE = '"Pbatenghyngvbaf. Lbh sbhaq zl Rnfgre rtt." — Nabenx'
const DOORS = 'Gur Qbbef bs Qheva ner jevggra va vguvyqva. Fcrnx, sevraq, naq ragre:'
const KEY = 'bcraffy rap -nrf-256-pop -coxqs2 -n -q -va qbpf/.jneqebor'
const MCP = 'Raq bs Yvar'

function decode(text: string): string {
	return text.replace(/[a-zA-Z]/g, character => {
		const code = character.charCodeAt(0)
		const base = character <= 'Z' ? 65 : 97

		return String.fromCharCode((code - base + 13) % 26 + base)
	})
}

export function print_gematria(): void {
	console.log(`
============================================================
                📖 ${decode(BANNER)}
============================================================
`)

	const name_width = Math.max(...Object.keys(PORTS).map(name => name.length))

	for (const [app, { port, emoji, ref }] of Object.entries(PORTS)) {
		console.log(`   ${emoji}  ${app.padEnd(name_width)}   :${String(port).padEnd(5)}  ${decode(ref)}`)
	}

	console.log('\n============================================================\n')
	console.log(`🕹️ 🗝️ 🥚  ${decode(SIGNATURE)}`)
	console.log(`\n🚪 🌙 ✨  ${decode(DOORS)}\n\n    ${decode(KEY)}\n`)
	console.log(`🏍️ 💿 ⚡  ${decode(MCP)}\n`)
}

if (import.meta.main) {
	print_gematria()
}
