import { get_concepts } from '$lib/server/ontology'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, locals: { db } }) {
	const search_criteria = Object.fromEntries(searchParams)

	const matches = await get_concepts(db)(search_criteria)

	return {
		matches,
	}
}
