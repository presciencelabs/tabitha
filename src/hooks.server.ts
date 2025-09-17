import { AUTH_SECRET, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from '$env/static/private'
import { SvelteKitAuth } from '@auth/sveltekit'
import Google from '@auth/sveltekit/providers/google'
import { error, type Handle, type RequestEvent } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const cors_handle: Handle = async function cors_handle({ event, resolve }) {
	const response = await resolve(event)

	const origin = event.request.headers.get('Origin')

	const FROM_TBTA_BIBLE_OPTIONAL_PORT = /\.(tabitha|pages)\.(bible|dev)(:\d+)?$/
	if (origin?.match(FROM_TBTA_BIBLE_OPTIONAL_PORT)) {
		response.headers.set('Access-Control-Allow-Origin', origin)
	}

	return response
}

const db_config_handle: Handle = async function db_config_handle({ event, resolve }) {
	if (!event.platform?.env.DB_Ontology) {
		throw error(500, `database missing from platform arg: ${JSON.stringify(event.platform)}`)
	}

	event.locals.db_ontology = event.platform?.env.DB_Ontology
	event.locals.db_auth = event.platform?.env.DB_Auth

	return resolve(event)
}

// https://authjs.dev/reference/sveltekit#lazy-initialization
const { handle: authn_handle } = SvelteKitAuth(initialize_config)

async function initialize_config(event: RequestEvent) {
	const clientId = event.platform?.env.GOOGLE_OAUTH_CLIENT_ID || GOOGLE_OAUTH_CLIENT_ID
	const clientSecret = event.platform?.env.GOOGLE_OAUTH_CLIENT_SECRET || GOOGLE_OAUTH_CLIENT_SECRET
	const secret = event.platform?.env.AUTH_SECRET || AUTH_SECRET

	return {
		providers: [
			Google({ clientId, clientSecret }),
		],

		secret,
		trustHost: true,
	}
}

const authz_handle: Handle = async ({ event, resolve }) => {
	await authz(event)

	return resolve(event)

	async function authz(event: RequestEvent) {
		const AUTH_ERROR_MESSAGE = 'You must be signed in and have permission to access this page'
		const { route, locals } = event

		if (route.id?.startsWith('/protected')) {
			const session = await locals.auth()

			if (!session?.user) {
				throw error(401, AUTH_ERROR_MESSAGE)
			}

			const sql = `
				SELECT true AS found
				FROM Users
				WHERE email = ? AND app = ?
			`
			const found = await locals.db_auth.prepare(sql).bind(session.user.email, 'ontology').first('found')
			if (!found) {
				throw error(401, AUTH_ERROR_MESSAGE)
			}
		}
	}
}

export const handle = sequence(cors_handle, db_config_handle, authn_handle, authz_handle)
