import { error } from '@sveltejs/kit'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	set_up_database()

	const response = await resolve(event)

	handle_cors()

	return response

	function set_up_database() {
		if (!event.platform?.env.DB_Ontology) {
			throw error(500, `database missing from platform arg: ${JSON.stringify(event.platform)}`)
		}

		event.locals.db = event.platform?.env.DB_Ontology
	}

	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
	// 	ours meets the conditions for a simple request scenario
	function handle_cors() {
		const origin = event.request.headers.get('Origin')

		const FROM_TBTA_BIBLE_OPTIONAL_PORT = /\.tbta\.bible(:\d+)?$/
		if (origin?.match(FROM_TBTA_BIBLE_OPTIONAL_PORT)) {
			response.headers.set('Access-Control-Allow-Origin', origin)
		}
	}
}
