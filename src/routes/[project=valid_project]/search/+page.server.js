import { search_text } from '$lib/server/search'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, params: { project }, locals: { db } }) {
	const q = searchParams.get('q')?.trim()
	if (!q) {
		return { results: [], search_term: '' }
	}

	const results = await search_text(db, project, q)
	return {
		results,
		search_term: q,
	}
}