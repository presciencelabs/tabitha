import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	check_classes_at_end,
	check_prose_scoping,
	check_pure_functions,
	check_snake_case_functions,
	check_strict_domain_typing,
	check_sveltekit_data_boundaries,
	check_tabs_indentation,
	findings,
} from './philosophies'

const script_dir = fileURLToPath(new URL('.', import.meta.url))
const root_dir = resolve(script_dir, '../..')

// Maps each rule to the AGENTS.md section that explains it, so a failing check
// can point a developer (or AI agent) straight to the "why" instead of just the "what".
const RULE_DOC_ANCHORS: Record<number, string> = {
	3: 'AGENTS.md#3-tabs-for-indentation',
	5: 'AGENTS.md#5-classes-at-the-end-of-elements',
	7: 'AGENTS.md#7-strict-domain-typing',
	10: 'AGENTS.md#10-snake_case-for-functions-variables-and-files',
	11: 'AGENTS.md#11-pure-functions',
	13: 'AGENTS.md#13-scope-prose-to-content-escape-with-not-prose',
	14: 'AGENTS.md#14-sveltekit-data-loading-boundaries',
}

async function get_source_files(dir: string): Promise<string[]> {
	if (!existsSync(dir)) return []
	const files: string[] = []
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
	return files
}

function get_changed_files(): Set<string> {
	const changed = new Set<string>()
	try {
		const { execSync } = require('node:child_process')
		const base_ref = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main'
		let output = ''
		try {
			output = execSync(`git diff --name-only ${base_ref}...HEAD`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
		} catch {
			try {
				output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
			} catch {
				output = execSync('git status --porcelain', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
			}
		}
		for (const line of output.split('\n')) {
			const file = line.trim().replace(/^[ MADRCU?!]{1,2}\s+/, '')
			if (file) changed.add(resolve(root_dir, file))
		}
	} catch {
		// Ignore git errors in environments without git history
	}
	return changed
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

	const changed_files = get_changed_files()
	const is_ci = process.env.GITHUB_ACTIONS === 'true'

	console.log(`🔍 Auditing ${all_files.length} source file(s) against Development Philosophies...`)
	if (changed_files.size > 0) {
		console.log(`📌 Detected ${changed_files.size} modified/updated file(s) in change set.\n`)
	} else {
		console.log('\n')
	}

	for (const file_path of all_files) {
		const content = await readFile(file_path, 'utf-8')
		const lines = content.split('\n')

		check_tabs_indentation(file_path, lines)
		check_classes_at_end(file_path, content, lines)
		check_strict_domain_typing(file_path, lines)
		check_snake_case_functions(file_path, lines)
		check_pure_functions(file_path, content)
		check_prose_scoping(file_path, content)
		check_sveltekit_data_boundaries(file_path, lines)
	}

	if (findings.length === 0) {
		console.log('✨ 100% Compliance! All inspected files adhere to the Development Philosophies.\n')
		return
	}

	console.log(`⚠️  Found ${findings.length} philosophy observation(s):\n`)

	for (const f of findings) {
		const rel_path = relative(root_dir, f.file_path)
		const is_updated_in_pr = changed_files.has(f.file_path)
		const pr_tag = is_updated_in_pr ? ' [PR MODIFIED]' : ''

		const doc_anchor = RULE_DOC_ANCHORS[f.rule_id]

		console.log(`[Philosophy #${f.rule_id}: ${f.rule_title}]${pr_tag}`)
		console.log(`  📄 ${rel_path}:${f.line_number}`)
		console.log(`  💡 ${f.message}`)
		console.log(`  🔎 "${f.snippet}"`)
		if (doc_anchor) console.log(`  📚 ${doc_anchor}`)
		console.log('')

		if (is_ci) {
			// GitHub Actions inline annotation (prioritizes changed files or annotates all non-blocking)
			const doc_suffix = doc_anchor ? ` (docs: ${doc_anchor})` : ''
			console.log(`::warning file=${rel_path},line=${f.line_number},title=Philosophy #${f.rule_id} (${f.rule_title})${pr_tag}::${f.message}${doc_suffix}`)
		}
	}

	console.log(`📋 Summary: ${findings.length} non-blocking observation(s) reported across ${all_files.length} files.\n`)

	const summary_file = process.env.GITHUB_STEP_SUMMARY
	if (is_ci && summary_file) {
		const { appendFile } = await import('node:fs/promises')
		let markdown = `## 🏛️ Architectural Philosophy & Compliance\n\n`
		if (findings.length === 0) {
			markdown += `✨ **100% Compliance!** All ${all_files.length} inspected source files adhere to the Development Philosophies.\n\n`
		} else {
			const repo = process.env.GITHUB_REPOSITORY || 'presciencelabs/tabitha'
			const sha = process.env.GITHUB_SHA || 'main'
			const doc_link = (rule_id: number) => {
				const anchor = RULE_DOC_ANCHORS[rule_id]
				return anchor ? `[docs](https://github.com/${repo}/blob/${sha}/${anchor})` : '—'
			}

			const pr_findings = findings.filter(f => changed_files.has(f.file_path))
			if (pr_findings.length > 0) {
				markdown += `### ✏️ Observations in PR-Modified Files (${pr_findings.length})\n\n`
				markdown += `| Rule | Location | Observation | Docs |\n`
				markdown += `| :--- | :--- | :--- | :--- |\n`
				for (const f of pr_findings) {
					const rel_path = relative(root_dir, f.file_path)
					markdown += `| **#${f.rule_id} (${f.rule_title})** | [\`${rel_path}#L${f.line_number}\`](https://github.com/${repo}/blob/${sha}/${rel_path}#L${f.line_number}) | ${f.message} | ${doc_link(f.rule_id)} |\n`
				}
				markdown += `\n`
			}

			markdown += `### 🌐 All Workspace Observations (${findings.length})\n\n`
			markdown += `| Scope | Rule | Location | Observation | Docs |\n`
			markdown += `| :--- | :--- | :--- | :--- | :--- |\n`
			for (const f of findings) {
				const rel_path = relative(root_dir, f.file_path)
				const scope = changed_files.has(f.file_path) ? '✏️ **PR File**' : '📄 Workspace'
				markdown += `| ${scope} | **#${f.rule_id} (${f.rule_title})** | [\`${rel_path}#L${f.line_number}\`](https://github.com/${repo}/blob/${sha}/${rel_path}#L${f.line_number}) | ${f.message} | ${doc_link(f.rule_id)} |\n`
			}
			markdown += `\n`
		}
		await appendFile(summary_file, markdown, 'utf-8')
	}
}

if (import.meta.main) {
	await audit_codebase()
}
