// @ts-check
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// @sveltejs/adapter-cloudflare emulates platform bindings in dev via wrangler's
// getPlatformProxy(), which logs "Using vars/secrets defined in .env..." at wrangler's
// "log" level on every invocation. Quiet that down unless the developer has opted into
// their own WRANGLER_LOG level (e.g. "debug" while diagnosing a bindings issue).
process.env.WRANGLER_LOG ??= 'warn'

/**
 * Creates standardized Vite configuration for Tabitha SvelteKit applications.
 *
 * @param {Object} options
 * @param {number} options.port Dedicated local development port
 * @param {string} [options.host] Hostname (defaults to 'localhost.tabitha.bible')
 * @param {any[]} [options.plugins] Additional Vite plugins
 * @param {Record<string, any>} [options.server] Server configuration overrides
 * @param {Record<string, any>} [options.ssr] SSR configuration overrides
 * @param {Record<string, any>} [options.rest] Additional Vite configuration options
 * @returns {import('vite').UserConfig}
 */
export function create_app_vite_config({
	port,
	host = 'localhost.tabitha.bible',
	plugins = [],
	server = {},
	ssr = {},
	...rest
}) {
	return defineConfig({
		plugins: [
			tailwindcss(),
			sveltekit(),
			...plugins,
		],
		server: {
			host,
			port,
			strictPort: true,
			...server,
		},
		ssr: {
			noExternal: ['@tabitha/types', '@tabitha/api-client', '@tabitha/ui'],
			...ssr,
		},
		// @ts-ignore - Vitest inline test configuration
		test: {
			include: ['src/**/*.test.ts'],
			environment: 'node',
		},
		...rest,
	})
}
