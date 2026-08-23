import { findings } from './types'

export function check_strict_domain_typing(file_path: string, lines: string[]) {
	// Philosophy 7: Strict domain typing (avoid : any or as any in TypeScript files)
	if (!file_path.endsWith('.ts') && !file_path.endsWith('.svelte')) return

	lines.forEach((line, idx) => {
		const trimmed = line.trim()
		if (trimmed.startsWith('//') || trimmed.startsWith('*')) return

		// Matches ': any' or 'as any'
		const any_match = line.match(/(:\s*any\b|\bas\s+any\b)/)
		if (any_match) {
			findings.push({
				rule_id: 7,
				rule_title: 'Strict domain typing',
				file_path,
				line_number: idx + 1,
				snippet: trimmed,
				message: `Explicit use of "${any_match[1].trim()}" detected. Prefer explicit types or discriminating unions.`,
			})
		}
	})
}
