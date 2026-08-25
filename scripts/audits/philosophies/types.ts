export type PhilosophyFinding = {
	rule_id: number
	rule_title: string
	file_path: string
	line_number: number
	snippet: string
	message: string
}

// Shared across every check_*.ts file: each check pushes its findings here as it scans.
export const findings: PhilosophyFinding[] = []

export const SVELTEKIT_FRAMEWORK_EXEMPTIONS = new Set(['handleError', 'handleFetch', 'handle', 'reroute', 'load'])

// Prose inside multi-line template literals (e.g. LLM prompt strings) and HTML comments has its
// own natural-language formatting, not code structure, so line-by-line checks should skip lines
// living entirely inside either. Returns a per-line predicate that tracks that state as it goes --
// call it once per line, in order, for the whole file. A quote-aware scan (rather than counting
// backticks alone) keeps a stray backtick inside a plain '...' or "..." string from being mistaken
// for a template-literal delimiter and desyncing the multi-line state for the rest of the file.
export function create_multiline_literal_tracker() {
	let in_template_literal = false
	let in_html_comment = false

	return function line_is_inside_multiline_literal(line: string): boolean {
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

		return was_in_template_literal || was_in_html_comment
	}
}
