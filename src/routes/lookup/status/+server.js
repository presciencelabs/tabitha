import { get_verse_statuses } from '$lib/data/status'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals: { db }, request }) {
	/** @type {Reference[]} */
	const references = await request.json()

	const results = await get_verse_statuses(db, references)

	return json(results)
}