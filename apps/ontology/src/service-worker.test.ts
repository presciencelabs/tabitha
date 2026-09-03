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
// ontology also has a real Google OAuth flow (/auth/*) and /protected/*
// routes serving per-user data, so its runtime-caching rule is a strict
// allowlist (only /examples) rather than a denylist - one accidental
// omission in a denylist is all it'd take to cache something authenticated.
// The extra assertions below exist specifically to guard that shape: they
// fail loudly if /protected or /auth ever appear in the compiled cache rule.
const vite_config_source = readFileSync(fileURLToPath(new URL('../vite.config.js', import.meta.url)), 'utf-8')
const compiled_sw_path = fileURLToPath(new URL('../.svelte-kit/output/client/sw.js', import.meta.url))

describe('service worker config (apps/ontology/vite.config.js)', () => {
	it('sets scope and base explicitly, so registration resolves relative to the site root, not the current route', () => {
		expect(vite_config_source).toMatch(/scope:\s*'\/'/)
		expect(vite_config_source).toMatch(/base:\s*'\/'/)
	})

	it('disables the default navigateFallback, which otherwise intercepts every navigation before any other route runs', () => {
		expect(vite_config_source).toMatch(/navigateFallback:\s*undefined/)
	})
})

describe('compiled service worker (apps/ontology/.svelte-kit/output/client/sw.js)', () => {
	if (!existsSync(compiled_sw_path)) {
		throw new Error(`${compiled_sw_path} does not exist - run \`bun run build\` before \`bun run test:unit\` to exercise this check.`)
	}

	const compiled_sw = readFileSync(compiled_sw_path, 'utf-8')

	it('does not register a NavigationRoute (the disabled navigateFallback default)', () => {
		expect(compiled_sw).not.toContain('NavigationRoute')
	})

	it('registers the /examples runtime-caching rule as NetworkFirst, GET-only', () => {
		expect(compiled_sw).toMatch(/"\/examples"===\w+\.pathname/)
		expect(compiled_sw).toContain('ontology-examples-api')
		expect(compiled_sw).toContain('NetworkFirst')
		expect(compiled_sw).toMatch(/,"GET"\)/)
	})

	it('never caches authenticated routes: no /protected or /auth path in the runtime-caching rule', () => {
		expect(compiled_sw).not.toContain('/protected')
		expect(compiled_sw).not.toContain('/auth')
	})

	it('precaches the build output', () => {
		expect(compiled_sw).toContain('revision:null')
	})
})
