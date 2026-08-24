import { findings } from './types'

export function check_tabs_indentation(file_path: string, lines: string[]) {
	// Philosophy 3: Tabs for indentation
	// Prose inside multi-line template literals (e.g. LLM prompt strings) and HTML
	// comments has its own natural-language formatting, not code structure, so lines
	// living entirely inside either are skipped rather than flagged. A quote-aware
	// scan (rather than counting backticks alone) keeps a stray backtick inside a
	// plain '...' or "..." string from being mistaken for a template-literal
	// delimiter and desyncing the multi-line state for the rest of the file.
	let in_template_literal = false
	let in_html_comment = false

	lines.forEach((line, idx) => {
		const was_in_template_literal = in_template_literal
		const was_in_html_comment = in_html_comment

		let in_single_quote = false
		let in_double_quote = false
		for (let i = 0; i < line.length; i++) {
			const ch = line[i]
			const escaped = line[i - 1] === '\\'
			if (in_template_literal) {
				if (ch === '`' && !escaped) in_template_literal = false
			} else if (in_single_quote) {
				if (ch === "'" && !escaped) in_single_quote = false
			} else if (in_double_quote) {
				if (ch === '"' && !escaped) in_double_quote = false
			} else if (ch === '/' && line[i + 1] === '/') {
				break // rest of the line is a line comment; ignore its content
			} else if (ch === '`') {
				in_template_literal = true
			} else if (ch === "'") {
				in_single_quote = true
			} else if (ch === '"') {
				in_double_quote = true
			}
		}
		if (line.includes('<!--')) in_html_comment = true
		if (line.includes('-->')) in_html_comment = false

		if (was_in_template_literal || was_in_html_comment) return

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
