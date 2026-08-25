import { describe, expect, it } from 'bun:test'
import { classify_files } from './plan'

describe('classify_files', () => {
	it('reports no_changes for an empty diff', () => {
		expect(classify_files([])).toEqual({ kind: 'no_changes' })
	})

	it('reports docs_only when every changed file is markdown', () => {
		expect(classify_files(['README.md', 'apps/copilot/README.md'])).toEqual({ kind: 'docs_only' })
	})

	it('is case-insensitive about the markdown extension', () => {
		expect(classify_files(['CHANGELOG.MD'])).toEqual({ kind: 'docs_only' })
	})

	it('reports scoped when changes are code, not docs', () => {
		expect(classify_files(['apps/editor/src/routes/+page.svelte'])).toEqual({ kind: 'scoped' })
	})

	it('reports scoped for a mix of docs and code in the same change', () => {
		expect(classify_files(['README.md', 'apps/editor/src/lib/thing.ts'])).toEqual({ kind: 'scoped' })
	})

	it('forces a full run when a workflow file changes', () => {
		expect(classify_files(['.github/workflows/ci.yml'])).toEqual({ kind: 'force_full', matched_file: '.github/workflows/ci.yml' })
	})

	it('forces a full run when a composite action changes', () => {
		expect(classify_files(['.github/actions/setup-workspace/action.yml'])).toEqual({
			kind: 'force_full',
			matched_file: '.github/actions/setup-workspace/action.yml',
		})
	})

	it('forces a full run when the root package.json changes', () => {
		expect(classify_files(['package.json'])).toEqual({ kind: 'force_full', matched_file: 'package.json' })
	})

	it('does not force a full run for an app-level package.json', () => {
		expect(classify_files(['apps/editor/package.json'])).toEqual({ kind: 'scoped' })
	})

	it('forces a full run when the lockfile changes', () => {
		expect(classify_files(['pnpm-lock.yaml'])).toEqual({ kind: 'force_full', matched_file: 'pnpm-lock.yaml' })
	})

	it('forces a full run when turbo.json changes', () => {
		expect(classify_files(['turbo.json'])).toEqual({ kind: 'force_full', matched_file: 'turbo.json' })
	})

	it('prefers force_full over docs_only when both would otherwise match', () => {
		expect(classify_files(['README.md', 'turbo.json'])).toEqual({ kind: 'force_full', matched_file: 'turbo.json' })
	})
})
