import { search_text } from '$lib/server/search'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, params: { project }, locals: { db } }) {
	const q = searchParams.get('q')?.trim()
	if (!q) {
		return { results: [], search_term: '' }
	}

	const return_to_raw = searchParams.get('return_to')?.trim()
	/** @type {ReturnTo|undefined} */
	const return_to = return_to_raw ? JSON.parse(decodeURIComponent(return_to_raw)) : undefined

	const results = await search_text(db, project, q)
	return {
		results,
		search_term: q,
		return_to,
	}
}