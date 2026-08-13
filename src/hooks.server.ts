import { building } from '$app/environment'
import type { D1Database } from '@cloudflare/workers-types'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
	set_up_database()

	const response = await resolve(event)

	handle_cors()

	return response

	function set_up_database() {
		if (!event.platform?.env.DB_Targets) {
			if (!building) {
				throw new Error(`database missing from platform arg: ${JSON.stringify(event.platform)}`)
			}
		}

		const db = event.platform?.env.DB_Targets
		event.locals.db = (db?.withSession ? db.withSession() : db) as unknown as D1Database
	}

	function handle_cors() {
		const origin = event.request.headers.get('Origin')

		const FROM_TBTA_BIBLE_OPTIONAL_PORT = /\.(tabitha\.bible|tbta\.workers\.dev)(:\d+)?$/
		if (origin?.match(FROM_TBTA_BIBLE_OPTIONAL_PORT)) {
			response.headers.set('Access-Control-Allow-Origin', origin)
		}
	}
}
