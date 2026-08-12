// @ts-check
import { defineConfig, devices } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false, // Avoid SQLite D1 lock conflicts in parallel workers
	workers: 1,
	reporter: 'list', // https://playwright.dev/docs/test-reporters

	// https://playwright.dev/docs/test-projects
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost.tabitha.bible:8789' },
		},
	],

	webServer: {
		command: 'pnpm build && pnpm dev',
		port: 8789,
		// Reuse active dev server locally to prevent port conflicts; start fresh server in CI
		reuseExistingServer: !process.env.CI,
	},
})
