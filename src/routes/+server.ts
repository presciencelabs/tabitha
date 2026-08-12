import { get_types } from '$lib/data/read'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db } }) => {
	const results = await get_types(db)
	return json(results)
}
