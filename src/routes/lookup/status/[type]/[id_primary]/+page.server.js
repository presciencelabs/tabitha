import { get_book_status, get_chapter_statuses_for_book } from '$lib/data/status'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { db }, params: { type, id_primary } }) {
	/** @type {StatusRequestReference} */
	const reference = { type, id_primary }

	const book_status = await get_book_status(db, reference)
	const chapter_statuses = await get_chapter_statuses_for_book(db, reference)

	return {
		book_status,
		chapter_statuses,
	}
}