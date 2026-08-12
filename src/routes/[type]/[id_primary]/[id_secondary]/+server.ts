import { get_tertiary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type, id_primary, id_secondary } }) => {
	const results = await get_tertiary_ids(db, type, id_primary, id_secondary)
	return json(results)
}
