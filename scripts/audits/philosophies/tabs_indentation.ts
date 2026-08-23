import { findings } from './types'

export function check_tabs_indentation(file_path: string, lines: string[]) {
	// Philosophy 3: Tabs for indentation
	lines.forEach((line, idx) => {
		const trimmed = line.trimStart()
		if (!trimmed || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

		const leading_spaces = line.match(/^( +)/)
		if (leading_spaces && leading_spaces[1].length >= 2) {
			findings.push({
				rule_id: 3,
				rule_title: 'Tabs for indentation',
				file_path,
				line_number: idx + 1,
				snippet: line.trim(),
				message: `Line is indented with ${leading_spaces[1].length} spaces instead of tab character(s).`,
			})
		}
	})
}
