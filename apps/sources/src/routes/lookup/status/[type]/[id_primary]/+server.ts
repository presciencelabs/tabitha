import { get_book_status } from '$lib/data/status'
import { cached_json } from '@tabitha/api-client'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type, id_primary } }) => {
	const result = await get_book_status({ db, reference: { type, id_primary } })

	return cached_json({ data: result })
}
