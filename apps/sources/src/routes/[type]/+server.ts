import { get_primary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type } }) => {
	const results = await get_primary_ids(db, type)
	return json(results)
}
