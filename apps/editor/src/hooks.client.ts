import type { HandleClientError } from '@sveltejs/kit'
import { initialize_detection } from '$lib/network'
import { initialize_theme } from '$lib/theme'

initialize_theme()

initialize_detection()

export const handleError: HandleClientError = async ({ error, event }) => {
	console.error('hooks.client.handleError: ', { error, event })
}
