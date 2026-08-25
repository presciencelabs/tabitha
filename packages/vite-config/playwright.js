// @ts-check
import { defineConfig, devices } from '@playwright/test'

/**
 * Creates standardized Playwright E2E configuration for Tabitha applications.
 *
 * @param {Object} options
 * @param {number} options.port Dedicated application dev port
 * @param {Record<string, any>} [options.overrides] Playwright configuration overrides
 * @returns {import('@playwright/test').PlaywrightTestConfig}
 */
export function create_app_playwright_config({
	port,
	...overrides
}) {
	return defineConfig({
		testDir: 'e2e',
		fullyParallel: false,
		workers: 1,
		reporter: 'list',
		projects: [
			{
				name: 'chromium',
				use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}` },
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
