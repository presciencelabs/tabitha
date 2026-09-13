import { describe, expect, it } from 'bun:test'
import { build_turbo_filter_args, classify_files, touches_windows_smoke_paths } from './plan'

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
		expect(classify_files(['bun.lock'])).toEqual({ kind: 'force_full', matched_file: 'bun.lock' })
	})

	it('forces a full run when turbo.json changes', () => {
		expect(classify_files(['turbo.json'])).toEqual({ kind: 'force_full', matched_file: 'turbo.json' })
	})

	it('prefers force_full over docs_only when both would otherwise match', () => {
		expect(classify_files(['README.md', 'turbo.json'])).toEqual({ kind: 'force_full', matched_file: 'turbo.json' })
	})
})

describe('build_turbo_filter_args', () => {
	it('puts the dots before the package name, not after', () => {
		// Regression test: `<pkg>...` (dots after) selects <pkg>'s own *dependencies* --
		// confirmed directly against a real PR that only touched packages/ui, where this bug
		// produced a filter covering @tabitha/ui's dependencies (eslint-config/tsconfig/types)
		// while silently excluding every one of the 6 apps that actually depend on it. The
		// correct direction, `...<pkg>`, selects the package and its *dependents* instead.
		expect(build_turbo_filter_args(['@tabitha/ui'])).toEqual(['--filter=...@tabitha/ui'])
	})

	it('builds one filter arg per changed package', () => {
		expect(build_turbo_filter_args(['@tabitha/ui', '@tabitha/types'])).toEqual([
			'--filter=...@tabitha/ui',
			'--filter=...@tabitha/types',
		])
	})

	it('returns an empty array for no changed packages', () => {
		expect(build_turbo_filter_args([])).toEqual([])
	})
})

describe('touches_windows_smoke_paths', () => {
	it('is false for an unrelated app change', () => {
		expect(touches_windows_smoke_paths(['apps/editor/src/routes/+page.svelte'])).toBe(false)
	})

	it('is true when a scripts/dx file changes', () => {
		expect(touches_windows_smoke_paths(['scripts/dx/db_load.ts'])).toBe(true)
	})

	it('is true when a tools/databases file changes', () => {
		expect(touches_windows_smoke_paths(['tools/databases/migrations/orchestrator.ts'])).toBe(true)
	})

	it('is true when only one file in a mixed change set matches', () => {
		expect(touches_windows_smoke_paths(['apps/editor/package.json', 'scripts/dx/setup.ts'])).toBe(true)
	})

	it('is false for an empty change set', () => {
		expect(touches_windows_smoke_paths([])).toBe(false)
	})
})
