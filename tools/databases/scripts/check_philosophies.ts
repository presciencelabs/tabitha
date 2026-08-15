import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script_dir = fileURLToPath(new URL('.', import.meta.url))
const root_dir = resolve(script_dir, '../../..')

interface PhilosophyFinding {
	rule_id: number
	rule_title: string
	file_path: string
	line_number: number
	snippet: string
	message: string
}

const findings: PhilosophyFinding[] = []

async function get_source_files(dir: string): Promise<string[]> {
	const files: string[] = []
	try {
		const entries = await readdir(dir, { withFileTypes: true })
		for (const entry of entries) {
			const full_path = join(dir, entry.name)
			if (entry.isDirectory()) {
				if (
					entry.name === 'node_modules' ||
					entry.name === '.svelte-kit' ||
					entry.name === 'dist' ||
					entry.name === '.wrangler' ||
					entry.name === '.turbo'
				) {
					continue
				}
				files.push(...(await get_source_files(full_path)))
			} else if (
				(entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.svelte')) &&
				!entry.name.endsWith('.d.ts') &&
				!entry.name.endsWith('.test.ts') &&
				!entry.name.endsWith('.spec.ts') &&
				!entry.name.endsWith('.spec.js')
			) {
				files.push(full_path)
			}
		}
	} catch {
		// Directory might not exist
	}
	return files
}

function check_tabs_indentation(file_path: string, lines: string[]) {
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

function check_classes_at_end(file_path: string, content: string, lines: string[]) {
	// Philosophy 5: Classes at the end of elements (in .svelte files)
	if (!file_path.endsWith('.svelte')) return

	// Regex looks for tags with class="..." followed by functional attributes like onclick, disabled, type, href
	const element_regex = /<([a-zA-Z0-9_-]+)\s+([^>]+)>/g
	let match

	while ((match = element_regex.exec(content)) !== null) {
		const tag_name = match[1]
		const attrs_string = match[2]

		if (tag_name === 'script' || tag_name === 'style') continue

		const class_match = attrs_string.match(/\bclass=["'{]/)
		if (!class_match || class_match.index === undefined) continue

		const class_pos = class_match.index
		const rest_of_attrs = attrs_string.slice(class_pos)

		// Check if functional attributes appear after class attribute
		const functional_attr_match = rest_of_attrs.match(/\b(onclick|onchange|onsubmit|onkeydown|type|disabled|href|value)=/)
		if (functional_attr_match) {
			const line_number = content.substring(0, match.index).split('\n').length
			findings.push({
				rule_id: 5,
				rule_title: 'Classes at the end of elements',
				file_path,
				line_number,
				snippet: match[0].slice(0, 80) + '...',
				message: `Element <${tag_name}> has functional attribute "${functional_attr_match[1]}" placed after class attribute.`,
			})
		}
	}
}

function check_strict_domain_typing(file_path: string, lines: string[]) {
	// Philosophy 7: Strict domain typing (avoid : any or as any)
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

function check_snake_case_functions(file_path: string, lines: string[]) {
	// Philosophy 10: snake_case for functions and variables
	lines.forEach((line, idx) => {
		const trimmed = line.trim()
		if (trimmed.startsWith('//') || trimmed.startsWith('*')) return

		// Match function declaration: function camelCase(
		const func_decl_match = trimmed.match(/\bfunction\s+([a-z]+[A-Z][a-zA-Z0-9]*)\s*\(/)
		// Match const fn = (...) => or const fn = function
		const const_fn_match = trimmed.match(/\b(?:const|let)\s+([a-z]+[A-Z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/)

		const camel_name = func_decl_match?.[1] || const_fn_match?.[1]
		if (camel_name) {
			findings.push({
				rule_id: 10,
				rule_title: 'snake_case for functions and variables',
				file_path,
				line_number: idx + 1,
				snippet: trimmed,
				message: `Function "${camel_name}" uses camelCase. Prefer snake_case naming.`,
			})
		}
	})
}

async function audit_codebase() {
	console.log(`
============================================================
       📜 TaBiThA Development Philosophy Compliance Audit   
============================================================
`)

	const search_dirs = [
		join(root_dir, 'apps/ontology/src'),
		join(root_dir, 'apps/sources/src'),
		join(root_dir, 'apps/targets/src'),
		join(root_dir, 'apps/editor/src'),
		join(root_dir, 'apps/copilot/src'),
		join(root_dir, 'packages/ui/src'),
		join(root_dir, 'packages/api-client/src'),
		join(root_dir, 'packages/types/src'),
	]

	const all_files: string[] = []
	for (const dir of search_dirs) {
		const files = await get_source_files(dir)
		all_files.push(...files)
	}

	console.log(`🔍 Auditing ${all_files.length} source file(s) against Development Philosophies...\n`)

	for (const file_path of all_files) {
		const content = await readFile(file_path, 'utf-8')
		const lines = content.split('\n')

		check_tabs_indentation(file_path, lines)
		check_classes_at_end(file_path, content, lines)
		check_strict_domain_typing(file_path, lines)
		check_snake_case_functions(file_path, lines)
	}

	if (findings.length === 0) {
		console.log('✨ 100% Compliance! All inspected files adhere to the Development Philosophies.\n')
		return
	}

	console.log(`⚠️  Found ${findings.length} philosophy observation(s):\n`)

	const is_ci = process.env.GITHUB_ACTIONS === 'true'

	for (const f of findings) {
		const rel_path = relative(root_dir, f.file_path)
		console.log(`[Philosophy #${f.rule_id}: ${f.rule_title}]`)
		console.log(`  📄 ${rel_path}:${f.line_number}`)
		console.log(`  💡 ${f.message}`)
		console.log(`  🔎 "${f.snippet}"\n`)

		if (is_ci) {
			// GitHub Actions inline annotation
			console.log(`::warning file=${rel_path},line=${f.line_number},title=Philosophy #${f.rule_id} (${f.rule_title})::${f.message}`)
		}
	}

	console.log(`📋 Summary: ${findings.length} non-blocking observation(s) reported across ${all_files.length} files.\n`)
}

if (import.meta.main) {
	await audit_codebase()
}
