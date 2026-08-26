import { describe, expect, it } from 'bun:test'
import {
	audit_and_sync_contributing_philosophy_count,
	audit_and_sync_readme_philosophy_count,
	get_canonical_philosophy_count,
	sync_philosophy_count,
} from './check_philosophy_count_sync'

describe('Philosophy Count Consistency Audit', () => {
	const sample_readme = `# TaBiThA Monorepo

<a href="AGENTS.md"><img src="https://img.shields.io/badge/Code_Style-14_Philosophies-blueviolet?style=flat-square" alt="14 Philosophies" /></a>

| # | Philosophy | Core Tenet |
| :-: | :--- | :--- |
| **1** | **Self-contained components** | ... |
| **13** | **Scope \`prose\` to content** | ... |
| **14** | **SvelteKit data-loading boundaries** | ... |
`

	const sample_contributing = `All contributions should adhere to the **14 TaBiThA Development Philosophies** and coding standards.

- **The 14 Philosophies**: Self-contained components, ..., and **SvelteKit data-loading boundaries**.
`

	describe('audit_and_sync_readme_philosophy_count', () => {
		it('reports clean sync when badge and table match the canonical count', () => {
			const result = audit_and_sync_readme_philosophy_count({ content: sample_readme, expected_count: 14 })
			expect(result.findings.length).toBe(0)
			expect(result.updated_content).toBe(sample_readme)
		})

		it('detects and fixes a stale badge count', () => {
			const stale = sample_readme.replace('Code_Style-14_Philosophies', 'Code_Style-12_Philosophies').replace(
				'alt="14 Philosophies"',
				'alt="12 Philosophies"',
			)
			const result = audit_and_sync_readme_philosophy_count({ content: stale, expected_count: 14 })
			expect(result.findings.some(f => f.location === 'README.md badge')).toBe(true)
			expect(result.updated_content).toContain('Code_Style-14_Philosophies')
			expect(result.updated_content).toContain('alt="14 Philosophies"')
		})

		it('flags a table missing its highest-numbered row without inventing content', () => {
			const truncated = sample_readme.replace('| **14** | **SvelteKit data-loading boundaries** | ... |\n', '')
			const result = audit_and_sync_readme_philosophy_count({ content: truncated, expected_count: 14 })
			const table_finding = result.findings.find(f => f.location === 'README.md philosophy table')
			expect(table_finding?.current).toBe(13)
			expect(table_finding?.expected).toBe(14)
			expect(result.updated_content).toBe(truncated)
		})
	})

	describe('audit_and_sync_contributing_philosophy_count', () => {
		it('reports clean sync when both mentions match the canonical count', () => {
			const result = audit_and_sync_contributing_philosophy_count({
				content: sample_contributing,
				expected_count: 14,
			})
			expect(result.findings.length).toBe(0)
		})

		it('detects and fixes a stale intro sentence and summary bullet', () => {
			const stale = sample_contributing
				.replace('14 TaBiThA Development Philosophies', '13 TaBiThA Development Philosophies')
				.replace('The 14 Philosophies', 'The 13 Philosophies')
			const result = audit_and_sync_contributing_philosophy_count({ content: stale, expected_count: 14 })
			expect(result.findings.length).toBe(2)
			expect(result.updated_content).toContain('14 TaBiThA Development Philosophies')
			expect(result.updated_content).toContain('The 14 Philosophies')
		})
	})

	describe('get_canonical_philosophy_count', () => {
		it('counts the live AGENTS.md heading total', async () => {
			const count = await get_canonical_philosophy_count()
			expect(count).toBeGreaterThan(0)
		})
	})

	describe('Live Workspace Synchronization', () => {
		it('verifies or auto-syncs live README.md and CONTRIBUTING.md', async () => {
			await sync_philosophy_count({ should_write: true })
			const verify_result = await sync_philosophy_count({ should_write: false })
			expect(verify_result.is_synced).toBe(true)
			expect(verify_result.findings.length).toBe(0)
		})
	})
})
