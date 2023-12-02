import {initialize_detection} from '$lib/network'
import {initialize_theme} from '$lib/theme'

initialize_theme()

initialize_detection()

/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({error, event}) {
	console.error('hooks.client.handleError: ', {error, event})
}
