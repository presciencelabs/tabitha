// @ts-check
import { defineConfig, devices } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true, // https://playwright.dev/docs/test-parallel
	reporter: 'list', // https://playwright.dev/docs/test-reporters

	// https://playwright.dev/docs/test-projects
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],

	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:8788',
	},
	use: {
		baseURL: 'http://localhost:8788',
	},
})
