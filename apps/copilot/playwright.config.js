import { create_app_playwright_config } from '@tabitha/vite-config/playwright'

const port = 8793

export default create_app_playwright_config({
	port,
	webServer: {
		command: 'pnpm dev',
		port,
		reuseExistingServer: !process.env.CI,
		env: {
			...process.env,
			// Mocks the AI Gateway so e2e specs that reach an AI code path (e.g. the "Get notes" flow)
			// don't make a real, billed call -- see e2e/support/mock_ai_gateway.mjs.
			NODE_OPTIONS: [process.env.NODE_OPTIONS, '--import ./e2e/support/mock_ai_gateway.mjs'].filter(Boolean).join(' '),
		},
	},
})
