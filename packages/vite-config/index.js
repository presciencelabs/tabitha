// @ts-check
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

/**
 * Creates standardized Vite configuration for Tabitha SvelteKit applications.
 *
 * @param {Object} options
 * @param {number} options.port Dedicated local development port
 * @param {string} [options.host] Hostname (defaults to 'localhost.tabitha.bible')
 * @param {any[]} [options.plugins] Additional Vite plugins
 * @param {Record<string, any>} [options.server] Server configuration overrides
 * @param {Record<string, any>} [options.rest] Additional Vite configuration options
 * @returns {import('vite').UserConfig}
 */
export function create_app_vite_config({
	port,
	host = 'localhost.tabitha.bible',
	plugins = [],
	server = {},
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
		// @ts-ignore - Vitest inline test configuration
		test: {
			include: ['src/**/*.test.ts'],
			environment: 'node',
		},
		...rest,
	})
}
