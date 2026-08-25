import { get_types } from '$lib/data/read'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export async function GET({ locals: { db } }: Parameters<RequestHandler>[0]) {
	const results = await get_types(db)
	return json(results)
}
