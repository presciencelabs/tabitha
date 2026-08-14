import { json } from '@sveltejs/kit'

const THREE_HOURS_IN_SECONDS = 3 * 60 * 60

/**
 * Returns a JSON Response with a Cache-Control header.
 * Defaults to a 3-hour cache (10800 seconds).
 */
export function cached_json<T>(data: T, max_age_seconds = THREE_HOURS_IN_SECONDS): Response {
	return json(data, {
		headers: {
			'cache-control': `max-age=${max_age_seconds}`,
		},
	})
}
