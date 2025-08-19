import { get_concepts } from '$lib/server/ontology'
import { get_function_words } from '$lib/server/function_words'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, locals: { db_ontology } }) {
	/** @type {ConceptSearchFilter} */
	const search_filter = {
		q: '',
		scope: 'stems',
		category: '',
		...Object.fromEntries(searchParams),
	}

	const results = [
		...await get_concepts(db_ontology)(search_filter),
		...get_function_words(search_filter),
	]

	return {
		results,
	}
}
