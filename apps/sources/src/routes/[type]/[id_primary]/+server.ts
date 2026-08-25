import { get_secondary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export async function GET({ locals: { db }, params: { type, id_primary } }: Parameters<RequestHandler>[0]) {
	const results = await get_secondary_ids({ db, type, id_primary })
	return json(results)
}
