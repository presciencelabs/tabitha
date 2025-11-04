import { search_text } from '$lib/server/search'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { project }, url: { searchParams } }) {
	const q = searchParams.get('q')?.trim()
	if (!q) {
		return json([])
	}

	const results = await search_text(db, project, q)
	return json(results)
}
