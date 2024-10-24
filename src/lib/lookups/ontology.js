import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { create_lookup_result } from '$lib/token'

/**
 * @param {Token} lookup_token
 */
export async function check_ontology(lookup_token) {
	const results = (await Promise.all(lookup_token.lookup_terms.map(get_matches_from_ontology))).flat()

	const found_results = results.reduce(transform_results, [])
	const not_found_results = lookup_token.lookup_results.filter(lookup => !results.some(LOOKUP_FILTERS.MATCHES_LOOKUP(lookup)))
	lookup_token.lookup_results = found_results.concat(not_found_results)

	/**
	 * @param {LookupResult[]} transformed_results
	 * @param {OntologyResult} ontology_result
	 * @returns {LookupResult[]}
	 */
	function transform_results(transformed_results, ontology_result) {
		const existing_result = lookup_token.lookup_results.find(LOOKUP_FILTERS.MATCHES_LOOKUP(ontology_result))

		if (existing_result) {
			// The stem was found in the form lookup
			transformed_results.push({
				...existing_result,
				...ontology_result,
				ontology_id: parseInt(ontology_result.id),
			})

		} else if (ontology_result.stem.toLowerCase() !== lookup_token.lookup_terms[0].toLowerCase()) {
			// Don't include new results that don't match the original token lookup term
			// eg. 'covering' should not match the noun 'cover', even though it matches the ontology search for the verb stem 'cover'
			// don't add it to the results

		} else {
			// The word exists in the Ontology, but was not found in the form lookup
			// This is the case for concepts like 'take-away'
			const new_result = create_lookup_result(ontology_result, { ontology_id: parseInt(ontology_result.id), ...ontology_result })
			transformed_results.push(new_result)
		}

		return transformed_results
	}
}

/**
 * @param {string} lookup_term
 *
 * @returns {Promise<OntologyResult[]>}
 */
async function get_matches_from_ontology(lookup_term) {
	const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${lookup_term}`)

	if (!response.ok) return []

	return response.json()
}
