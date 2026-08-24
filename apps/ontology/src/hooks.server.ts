import { AUTH_SECRET, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_PROXY_URL } from '$env/static/private'
import { PUBLIC_CORS_ALLOW_LOCALHOST } from '$env/static/public'
import { is_authorized } from '$lib/server/auth'
import { sync_complex_terms } from '$lib/server/complex_terms'
import { create_cors_handle } from '@tabitha/cors'
import { SvelteKitAuth } from '@auth/sveltekit'
import Google from '@auth/sveltekit/providers/google'
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types'
import { error, type Handle, type RequestEvent } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const cors_handle = create_cors_handle({ allow_localhost: Boolean(PUBLIC_CORS_ALLOW_LOCALHOST) })

const db_config_handle: Handle = async function db_config_handle({ event, resolve }) {
	if (!event.platform?.env.DB_Ontology) {
		console.error('Database binding DB_Ontology is missing from platform environment.')
		throw error(500, 'Database configuration error: DB_Ontology binding is missing.')
	}

	event.locals.db_ontology = event.platform.env.DB_Ontology.withSession()
	event.locals.db_auth = event.platform.env.DB_Auth.withSession()

	return resolve(event)
}

// https://authjs.dev/reference/sveltekit#lazy-initialization
const { handle: authn_handle } = SvelteKitAuth(initialize_config)

async function initialize_config(event: RequestEvent) {
	const clientId = event.platform?.env.GOOGLE_OAUTH_CLIENT_ID || GOOGLE_OAUTH_CLIENT_ID
	const clientSecret = event.platform?.env.GOOGLE_OAUTH_CLIENT_SECRET || GOOGLE_OAUTH_CLIENT_SECRET
	const secret = event.platform?.env.AUTH_SECRET || AUTH_SECRET

	/**
	 * GOOGLE OAUTH REDIRECT PROXY FOR PREVIEW ENVIRONMENTS:
	 * Google OAuth 2.0 strictly disallows wildcards in Authorized Redirect URIs (RFC 6749 security restriction).
	 * Cloudflare Workers generates dynamic subdomains for branch preview deployments (e.g. `*-ontology.tbta.workers.dev`).
	 *
	 * Setting `redirectProxyUrl` to `https://ontology.tabitha.bible/auth`:
	 * - On Preview (`*-ontology.tbta.workers.dev`): Auth.js sees it is not on the proxy host, so it sends
	 *   `redirect_uri = https://ontology.tabitha.bible/auth/callback/google` to Google.
	 * - On Production (`ontology.tabitha.bible`): Auth.js sees `url.origin === redirectProxyUrl.origin` and sets
	 *   `isOnRedirectProxy = true`, allowing production to receive the OAuth callback, decrypt the state, and
	 *   forward the user back to the preview deployment.
	 *
	 * OAUTH_REDIRECT_PROXY_URL holds this value in `.env` (used by both prod and preview) and is forced
	 * blank in local dev's `.env.local` by scripts/dx/setup_env.ts, so Auth.js falls back to its own
	 * no-proxy default there instead of a hostname check baked into this code.
	 */
	const redirectProxyUrl = OAUTH_REDIRECT_PROXY_URL || undefined

	return {
		providers: [
			Google({ clientId, clientSecret }),
		],

		secret,
		trustHost: true,
		redirectProxyUrl,
	}
}

const authz_handle: Handle = async ({ event, resolve }) => {
	await authz(event)

	return resolve(event)

	async function authz(event: RequestEvent) {
		const AUTH_ERROR_MESSAGE = 'You must be signed in and have permission to access this page'
		const { route, locals } = event

		const session = await locals.auth()
		locals.user = session?.user

		if (route.id?.startsWith('/protected')) {
			if (!await is_authorized({ locals, permission: 'PROTECTED_ACCESS' })) {
				throw error(401, AUTH_ERROR_MESSAGE)
			}
		}
	}
}

export const handle = sequence(cors_handle, db_config_handle, authn_handle, authz_handle)

type ScheduledArgs = {
	event: ScheduledEvent
	env: App.Platform['env']
	ctx: ExecutionContext
}

export async function scheduled({ event, env, ctx }: ScheduledArgs) {
	if (!env?.DB_Ontology) return

	switch (event.cron) {
		case '0 */12 * * *':
			ctx.waitUntil(sync_complex_terms(env.DB_Ontology))
			break
		default:
			console.info(`Cron not recognized for schedule: ${event.cron}`)
			break
	}
}



