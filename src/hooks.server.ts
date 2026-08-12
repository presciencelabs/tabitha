import { building } from '$app/environment'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
	set_up_database()

	const response = await resolve(event)

	handle_cors()

	return response

	function set_up_database() {
		if (!event.platform?.env.DB_Sources) {
			if (!building) {
				throw new Error(`database missing from platform arg: ${JSON.stringify(event.platform)}`)
			}
		}

		// putting it on `locals` to clean up usage in routes
		// @ts-expect-error until local bindings issue resolved
		event.locals.db = event.platform?.env.DB_Sources?.withSession()
	}

	function handle_cors() {
		const origin = event.request.headers.get('Origin')

		const FROM_TBTA_BIBLE_OPTIONAL_PORT = /\.(tabitha|pages)\.(bible|dev)(:\d+)?$/
		if (origin?.match(FROM_TBTA_BIBLE_OPTIONAL_PORT)) {
			response.headers.set('Access-Control-Allow-Origin', origin)
		}
	}
}
