import { get_book_status } from '$lib/data/status'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary } }) {
	const result = await get_book_status(db, { type, id_primary })

	const SIX_HOUR_CACHE = {
		'cache-control': `max-age=${6 * 60 * 60}`,
	}
	return json(result, {
		headers: SIX_HOUR_CACHE,
	})
}