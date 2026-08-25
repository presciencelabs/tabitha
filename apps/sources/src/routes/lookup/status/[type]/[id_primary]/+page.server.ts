import { get_book_status, get_chapter_statuses_for_book } from '$lib/data/status'
import type { PageServerLoad } from './$types'
import type { StatusRequestReference } from '$lib/types'

export async function load({ locals: { db }, params: { type, id_primary } }: Parameters<PageServerLoad>[0]) {
	const reference: StatusRequestReference = { type, id_primary }

	const book_status = await get_book_status({ db, reference })
	const chapter_statuses = await get_chapter_statuses_for_book({ db, reference })

	return {
		book_status,
		chapter_statuses,
	}
}
