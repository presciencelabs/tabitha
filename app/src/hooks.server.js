import {building} from '$app/environment'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({event, resolve}) {
	set_up_database()

	const response = await resolve(event)

	handle_cors()

	return response

	function set_up_database() {
		if (!event.platform?.env.DB_Sources) {
			// this if is necessary because of all this stuff:
			//		https://github.com/sveltejs/kit/issues/4292
			//		https://github.com/sveltejs/kit/issues/10389
			//
			// possible solution:  https://github.com/gerhardcit/svelte-cf-bindings-poc
			//		TODO: monitor for updates so we can remove this if or utilize a local version
			if (!building) {
				throw new Error(`database missing from platform arg: ${JSON.stringify(event.platform)}`)
			}
		}

		// putting it on `locals` to clean up usage in routes
		// @ts-ignore until the TODO above is resolved
		event.locals.db = event.platform?.env.DB_Sources
	}

	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
	// 	ours meets the conditions for a simple request scenario
	function handle_cors() {
		const origin = event.request.headers.get('Origin')

		if (origin?.match(/tbta.bible/)) {
			response.headers.set('Access-Control-Allow-Origin', origin)
		}
	}
}
