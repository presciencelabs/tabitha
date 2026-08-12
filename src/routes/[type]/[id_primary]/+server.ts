import { get_secondary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type, id_primary } }) => {
	const results = await get_secondary_ids(db, type, id_primary)
	return json(results)
}
