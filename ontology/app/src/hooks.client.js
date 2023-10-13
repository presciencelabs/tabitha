import {initialize_theme} from '$lib/theme'

initialize_theme()

/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({error, event}) {
	console.error({error, event})
}
