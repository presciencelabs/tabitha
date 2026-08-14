import { get_book_status } from '$lib/data/status'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type, id_primary } }) => {
	const result = await get_book_status(db, { type, id_primary })

	const SIX_HOUR_CACHE = {
		'cache-control': `max-age=${6 * 60 * 60}`,
	}
	return json(result, {
		headers: SIX_HOUR_CACHE,
	})
}
