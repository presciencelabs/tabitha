import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { create_lookup_result, split_stem_and_sense } from '$lib/token'

/**
 * @param {Token} lookup_token
 */
export async function check_how_to(lookup_token) {
	const results = (await Promise.all(lookup_token.lookup_terms.map(get_matches_from_how_to))).flat()
	
	for (let how_to_result of results) {
		const how_to_values = {
			...split_stem_and_sense(how_to_result.term),
			...how_to_result,
		}

		const existing_result = lookup_token.lookup_results.find(
			lookup => LOOKUP_FILTERS.MATCHES_LOOKUP(how_to_values)(lookup)
				&& LOOKUP_FILTERS.MATCHES_SENSE(how_to_values)(lookup),
		)

		if (existing_result) {
			// The sense exists in the ontology and the how-to
			existing_result.how_to_entries.push(how_to_result)

		} else if (how_to_values.stem.toLowerCase() !== lookup_token.lookup_terms[0].toLowerCase()) {
			// The word exists in the how-to but it doesn't match the token based on the form
			// eg. the token 'witnessing' should not match with the how-to result for the Noun 'witness'
			// don't add it to the results

		} else if (how_to_values.sense) {
			// The sense exists in the how-to but not in the ontology, but is planned to be added
			const new_result = create_lookup_result(how_to_values, {
				sense: how_to_values.sense,
				level: 2,		// since it's in the how-to, it's expected to be complex
				gloss: 'Not yet in Ontology (but should be soon)',
				how_to: [how_to_result],
			})
			lookup_token.lookup_results.push(new_result)

		} else {
			// The word exists in the how-to but not in the ontology, and may never be
			const new_result = create_lookup_result(how_to_values, { how_to: [how_to_result] })
			lookup_token.lookup_results.push(new_result)
		}
	}
}

/**
 * @param {LookupTerm} lookup_term
 * @returns {Promise<HowToResult[]>}
 */
async function get_matches_from_how_to(lookup_term) {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/simplification_hints?complex_term=${lookup_term}`)

	if (!response.ok) return []

	return response.json()
}
