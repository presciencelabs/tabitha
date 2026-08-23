import { building } from '$app/environment'
import { PUBLIC_CORS_ALLOW_LOCALHOST } from '$env/static/public'
import { create_cors_handle } from '@tabitha/cors'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const cors_handle = create_cors_handle({ allow_localhost: Boolean(PUBLIC_CORS_ALLOW_LOCALHOST) })

const db_config_handle: Handle = async function db_config_handle({ event, resolve }) {
	if (!event.platform?.env.DB_Sources) {
		if (!building) {
			throw new Error(`database missing from platform arg: ${JSON.stringify(event.platform)}`)
		}
	}

	// putting it on `locals` to clean up usage in routes
	// @ts-expect-error until local bindings issue resolved
	event.locals.db = event.platform?.env.DB_Sources?.withSession()

	return resolve(event)
}

export const handle = sequence(cors_handle, db_config_handle)
