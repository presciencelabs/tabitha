import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { json } from '@sveltejs/kit'


/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams } }) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	let matches = await get_matches_from_ontology(word)

	return response({ term: word, matches })

	/** @param {LookupResult<OntologyResult>} result  */
	function response(result) {
		const THREE_HOUR_CACHE = {
			'cache-control': `max-age=${3 * 60 * 60}`,
		}

		return json(result, {
			headers: THREE_HOUR_CACHE,
		})
	}
}

/**
 * @param {string} lookup_term
 *
 * @returns {Promise<OntologyResult[]>}
 */
async function get_matches_from_ontology(lookup_term) {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/?q=${lookup_term}`)

	if (!response.ok) return []

	return response.json()
}