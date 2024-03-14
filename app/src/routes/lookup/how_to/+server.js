import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { split_stem_and_sense } from '$lib/parser/token'
import { json } from '@sveltejs/kit'


/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams } }) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	let matches = (await get_matches_from_how_to(word)).map(transform_response)

	return response({ term: word, matches })

	/** @param {LookupResponse<HowToResult>} result  */
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
 * @returns {Promise<HowToResponse[]>}
 */
async function get_matches_from_how_to(lookup_term) {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/simplification_hints?complex_term=${lookup_term}`)

	if (!response.ok) return []

	return response.json()
}

/**
 * 
 * @param {HowToResponse} response 
 * @returns {HowToResult}
 */
function transform_response(response) {
	const { stem, sense } = split_stem_and_sense(response.term)
	return {
		stem,
		sense,
		...response,
	}
}