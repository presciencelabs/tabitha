import { building } from '$app/environment'
import { PUBLIC_CORS_ALLOW_LOCALHOST } from '$env/static/public'
import { create_cors_handle } from '@tabitha/cors'
import { create_rate_limit_handle } from '@tabitha/rate-limit'
import type { D1Database } from '@cloudflare/workers-types'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const cors_handle = create_cors_handle({ allow_localhost: Boolean(PUBLIC_CORS_ALLOW_LOCALHOST) })
const rate_limit_handle = create_rate_limit_handle()

const db_config_handle: Handle = async function db_config_handle({ event, resolve }) {
	if (!event.platform?.env.DB_Targets) {
		if (!building) {
			throw new Error(`database missing from platform arg: ${JSON.stringify(event.platform)}`)
		}
	}

	const db = event.platform?.env.DB_Targets
	event.locals.db = (db?.withSession ? db.withSession() : db) as unknown as D1Database

	return resolve(event)
}

export const handle = sequence(cors_handle, rate_limit_handle, db_config_handle)
