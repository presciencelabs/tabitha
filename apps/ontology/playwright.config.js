import { create_app_playwright_config } from '@tabitha/vite-config/playwright'

export default create_app_playwright_config({
	port: 3056,
	// Mints a signed-in session for tests without touching Google OAuth -- see e2e/README.md.
	globalSetup: './e2e/auth.setup.ts',
	use: { storageState: 'e2e/.auth/user.json' },
})
