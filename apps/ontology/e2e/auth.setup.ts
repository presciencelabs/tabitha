import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encode } from '@auth/core/jwt'
import { chromium } from '@playwright/test'

// See apps/ontology/e2e/README.md for why this exists and how it works.

const TEST_USER_EMAIL = 'e2e-test@tabitha.local'
const SESSION_COOKIE_NAME = 'authjs.session-token' // unprefixed: local dev runs over http, not https
const STORAGE_STATE_PATH = 'e2e/.auth/user.json'

const app_dir = dirname(dirname(fileURLToPath(import.meta.url)))
const root_dir = join(app_dir, '../..')

function read_env_var(name: string): string {
	for (const file of ['.env.local', '.env']) {
		const path = join(app_dir, file)
		if (!existsSync(path)) continue
		const match = readFileSync(path, 'utf-8').match(new RegExp(`^${name}=(.*)$`, 'm'))
		if (match) return match[1].trim()
	}
	throw new Error(`Missing ${name} in apps/ontology/.env.local -- run \`bun run setup:env\` first.`)
}

export default async function global_setup() {
	// Grant the test account Ontology permissions in the local Auth D1 -- the same command a developer runs by hand.
	execFileSync('bun', [join(root_dir, 'scripts/dx/grant_permission.ts'), TEST_USER_EMAIL], { stdio: 'inherit' })

	// Mint a valid Auth.js session cookie directly, bypassing Google OAuth entirely.
	const session_token = await encode({
		secret: read_env_var('AUTH_SECRET'),
		salt: SESSION_COOKIE_NAME,
		token: { email: TEST_USER_EMAIL, name: 'E2E Test User' },
	})

	const browser = await chromium.launch()
	const context = await browser.newContext()
	await context.addCookies([{
		name: SESSION_COOKIE_NAME,
		value: session_token,
		domain: 'localhost',
		path: '/',
		httpOnly: true,
		sameSite: 'Lax',
	}])
	await context.storageState({ path: STORAGE_STATE_PATH })
	await browser.close()
}
