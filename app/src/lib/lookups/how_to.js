import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { create_lookup_result, split_stem_and_sense } from '$lib/parser/token'
import { lookups_match, senses_match } from './common'

/**
 * @param {Token} lookup_token
 */
export async function check_how_to(lookup_token) {
	const results = (await Promise.all(lookup_token.lookup_terms.map(get_matches_from_how_to))).flat().map(transform_response)
	
	for (let how_to_result of results) {
		const existing_result = lookup_token.lookup_results.find(lookup => lookups_match(lookup, how_to_result) && senses_match(lookup, how_to_result))
		if (existing_result) {
			// The sense exists in the ontology and the how-to
			existing_result.how_to.push(how_to_result)

		} else if (how_to_result.stem.toLowerCase() !== lookup_token.lookup_terms[0].toLowerCase()) {
			// The word exists in the how-to but it doesn't match the token based on the form
			// eg. the token 'witnessing' should not match with the how-to result for the Noun 'witness'
			// don't add it to the results
			
		} else if (how_to_result.sense) {
			// The sense exists in the how-to but not in the ontology, but is planned to be added
			const new_result = create_lookup_result(how_to_result, { how_to: [how_to_result] })
			new_result.concept = {
				id: '0',
				stem: new_result.stem,
				sense: how_to_result.sense,
				part_of_speech: new_result.part_of_speech,
				level: 2,		// since it's in the how-to, it's expected to be complex
				gloss: 'Not yet in Ontology (but should be soon)',
				categorization: '',
			}
			lookup_token.lookup_results.push(new_result)

		} else {
			// The word exists in the how-to but not in the ontology, and may never be
			const new_result = create_lookup_result(how_to_result, { how_to: [how_to_result] })
			lookup_token.lookup_results.push(new_result)
		}
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
}

/**
 * @param {LookupTerm} lookup_term
 * @returns {Promise<HowToResponse[]>}
 */
async function get_matches_from_how_to(lookup_term) {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/simplification_hints?complex_term=${lookup_term}`)

	if (!response.ok) return []

	return response.json()
}
