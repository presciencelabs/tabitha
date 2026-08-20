import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Why this test exists, and why it looks the way it does:
//
// @vite-pwa/sveltekit has two failure modes that only show up at runtime, not
// at typecheck or lint time - see docs/decisions/0001-service-worker-strategy.md
// for the full story. Both were only caught by manually building, then
// serving the real compiled worker through `wrangler dev` against live D1
// bindings and driving it with a real browser. That manual pass is still the
// most trustworthy way to validate this, but it isn't something to repeat by
// hand before every change, and standing up `wrangler dev` as an ongoing,
// automated E2E harness is real cost (slower CI, another moving part, its own
// local-state flakiness) for fidelity this app doesn't need day to day.
//
// This is the pragmatic middle ground: a fast, server-less check that the
// config still contains the fix, and that the compiled output still reflects
// it. It can't catch everything a real browser run would - it's a guard
// against regression, not a replacement for the manual verification that
// found these issues in the first place.
//
// Unlike editor/sources, targets has no runtimeCaching rule to check: its
// Explorer UI never makes client-side fetch() calls to its own API (data
// loading happens server-side), so there's nothing for one to cache. This app
// only gets asset precaching for now.
const vite_config_source = readFileSync(fileURLToPath(new URL('../vite.config.js', import.meta.url)), 'utf-8')
const compiled_sw_path = fileURLToPath(new URL('../.svelte-kit/output/client/sw.js', import.meta.url))

describe('service worker config (apps/targets/vite.config.js)', () => {
	it('sets scope and base explicitly, so registration resolves relative to the site root, not the current route', () => {
		expect(vite_config_source).toMatch(/scope:\s*'\/'/)
		expect(vite_config_source).toMatch(/base:\s*'\/'/)
	})

	it('disables the default navigateFallback, which otherwise intercepts every navigation before any other route runs', () => {
		expect(vite_config_source).toMatch(/navigateFallback:\s*undefined/)
	})
})

describe('compiled service worker (apps/targets/.svelte-kit/output/client/sw.js)', () => {
	if (!existsSync(compiled_sw_path)) {
		throw new Error(`${compiled_sw_path} does not exist - run \`pnpm build\` before \`pnpm test:unit\` to exercise this check.`)
	}

	const compiled_sw = readFileSync(compiled_sw_path, 'utf-8')

	it('does not register a NavigationRoute (the disabled navigateFallback default)', () => {
		expect(compiled_sw).not.toContain('NavigationRoute')
	})

	it('precaches the build output', () => {
		expect(compiled_sw).toContain('revision:null')
	})
})
