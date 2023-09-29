import { get_concepts } from '$data/ontology'

/** @type {import('./$types').PageLoad} */
export async function load({ url: { searchParams } }) {
	const query = searchParams.get('query')
	
	return {
		matches: query === null ? [] : get_concepts(query),
	}
}