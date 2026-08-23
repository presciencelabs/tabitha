import { findings, SVELTEKIT_FRAMEWORK_EXEMPTIONS } from './types'

function split_top_level_params(params_raw: string): string[] {
	// Splits a parameter list on top-level commas only, tracking nested (), {}, [], <> so
	// generics, destructured objects, and default-value calls don't get split mid-expression.
	const params: string[] = []
	let depth = 0
	let current = ''
	for (const char of params_raw) {
		if (char === '(' || char === '{' || char === '[' || char === '<') depth++
		else if (char === ')' || char === '}' || char === ']' || char === '>') depth--
		if (char === ',' && depth === 0) {
			params.push(current.trim())
			current = ''
		} else {
			current += char
		}
	}
	if (current.trim()) params.push(current.trim())
	return params
}

function extract_matching_brace_body(content: string, start_index: number): string | null {
	let idx = start_index
	while (idx < content.length && /\s/.test(content[idx])) idx++
	if (content[idx] !== '{') return null

	let depth = 0
	const body_start = idx
	for (; idx < content.length; idx++) {
		if (content[idx] === '{') depth++
		else if (content[idx] === '}') {
			depth--
			if (depth === 0) return content.slice(body_start, idx + 1)
		}
	}
	return content.slice(body_start)
}

const BOOLEAN_PARAM_PATTERN = /^([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:\s*boolean\b/

function references_param_in_conditional(body: string, param_name: string): boolean {
	const escaped = param_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const conditional_patterns = [
		new RegExp(`\\b(if|while)\\s*\\([^)]*\\b${escaped}\\b`),
		new RegExp(`\\b${escaped}\\b\\s*\\?[^:?]*:`),
		new RegExp(`(&&|\\|\\|)\\s*${escaped}\\b`),
		new RegExp(`\\b${escaped}\\b\\s*(&&|\\|\\|)`),
	]
	return conditional_patterns.some(p => p.test(body))
}

const FUNCTION_SIGNATURE_PATTERN =
	/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^)]*>)?\s*\(([^)]*)\)|(?:export\s+)?(?:const|let)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:<[^)]*>)?\(([^)]*)\)\s*(?::[^=>{]+)?=>/g

export function check_pure_functions(file_path: string, content: string) {
	// Philosophy 11: Pure functions -- receive one argument (destructure an options object
	// for multiple inputs) and avoid boolean "flag" parameters that branch a function's behavior.
	if (!file_path.endsWith('.ts') && !file_path.endsWith('.svelte')) return

	const regex = new RegExp(FUNCTION_SIGNATURE_PATTERN)
	let match

	while ((match = regex.exec(content)) !== null) {
		const name = match[1] || match[3]
		const params_raw = (match[2] ?? match[4] ?? '').trim()
		if (!name || SVELTEKIT_FRAMEWORK_EXEMPTIONS.has(name) || !params_raw) continue

		const params = split_top_level_params(params_raw)
		const line_number = content.substring(0, match.index).split('\n').length
		const snippet = `${name}(${params_raw.replace(/\s+/g, ' ')})`.slice(0, 100)

		if (params.length > 1) {
			findings.push({
				rule_id: 11,
				rule_title: 'Pure functions',
				file_path,
				line_number,
				snippet,
				message: `Function "${name}" takes ${params.length} arguments. Prefer a single argument, destructuring an options object when multiple inputs are needed.`,
			})
		}

		const search_start = match.index + match[0].length
		const body =
			extract_matching_brace_body(content, search_start) ?? content.slice(search_start, search_start + 400)

		for (const param of params) {
			const bool_match = param.match(BOOLEAN_PARAM_PATTERN)
			if (!bool_match) continue

			const param_name = bool_match[1]
			if (references_param_in_conditional(body, param_name)) {
				findings.push({
					rule_id: 11,
					rule_title: 'Pure functions',
					file_path,
					line_number,
					snippet,
					message: `Function "${name}" has boolean parameter "${param_name}" that drives conditional logic in its body. Split into separate, single-purpose functions instead of branching on a flag argument.`,
				})
				break
			}
		}
	}
}
