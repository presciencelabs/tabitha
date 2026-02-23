/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	
	const response = await resolve(event)

	handle_cors()

	return response
	

	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
	// 	ours meets the conditions for a simple request scenario
	function handle_cors() {
		const origin = event.request.headers.get('Origin')

		const FROM_TBTA_BIBLE_OPTIONAL_PORT = /\.(tabitha|pages)\.(bible|dev)(:\d+)?$/
		if (origin?.match(FROM_TBTA_BIBLE_OPTIONAL_PORT)) {
			response.headers.set('Access-Control-Allow-Origin', origin)
		}
	}
}
