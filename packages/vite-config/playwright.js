// @ts-check
import { defineConfig, devices } from '@playwright/test'

/**
 * Creates standardized Playwright E2E configuration for Tabitha applications.
 *
 * @param {Object} options
 * @param {number} options.port Dedicated application dev port
 * @param {string} [options.host] Hostname (defaults to 'localhost.tabitha.bible')
 * @param {string} [options.test_dir] Test directory (defaults to 'e2e')
 * @param {Record<string, any>} [options.overrides] Playwright configuration overrides
 * @returns {import('@playwright/test').PlaywrightTestConfig}
 */
export function create_app_playwright_config({
	port,
	host = 'localhost.tabitha.bible',
	test_dir = 'e2e',
	...overrides
}) {
	return defineConfig({
		testDir: test_dir,
		fullyParallel: false,
		workers: 1,
		reporter: 'list',
		projects: [
			{
				name: 'chromium',
				use: { ...devices['Desktop Chrome'], baseURL: `http://${host}:${port}` },
			},
		],
		webServer: {
			command: 'pnpm dev',
			port,
			reuseExistingServer: !process.env.CI,
		},
		...overrides,
	})
}
