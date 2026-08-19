import type { HandleClientError } from '@sveltejs/kit'

export const handleError: HandleClientError = async ({ error, event }) => {
	console.error('hooks.client.handleError: ', { error, event })
}
