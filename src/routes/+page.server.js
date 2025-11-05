import { get_concepts } from '$lib/server/ontology'
import { get_function_words } from '$lib/server/function_words'
import { redirect } from '@sveltejs/kit'
import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, locals: { db_ontology } }) {
	/** @type {ConceptSearchFilter} */
	const search_filter = {
		q: '',
		scope: 'stems',
		category: '',
		...Object.fromEntries(searchParams),
	}

	if (search_filter.scope === 'english') {
		const return_to = { app: 'ontology', q: search_filter.q }
		const return_to_url = encodeURIComponent(JSON.stringify(return_to))
		throw redirect(303, `${PUBLIC_TARGETS_API_HOST}/English/search?q=${search_filter.q}&return_to=${return_to_url}`)
	}

	const results = [
		...await get_concepts(db_ontology)(search_filter),
		...get_function_words(search_filter),
	]

	return {
		results,
	}
}
