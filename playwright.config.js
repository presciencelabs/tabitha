// @ts-check
import { defineConfig, devices } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true, // https://playwright.dev/docs/test-parallel
	reporter: 'list', // https://playwright.dev/docs/test-reporters

	// https://playwright.dev/docs/test-projects
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost.tabitha.bible:5173' },
		},
	],

	webServer: {
		command: 'pnpm build && pnpm dev',
		port: 5173,
		// Reuse active dev server locally to prevent port conflicts; start fresh server in CI
		reuseExistingServer: !process.env.CI,
	},
})
