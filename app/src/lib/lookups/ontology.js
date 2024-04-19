import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { create_lookup_result } from '$lib/parser/token'

/**
 * @param {Token} lookup_token
 */
export async function check_ontology(lookup_token) {
	const results = (await Promise.all(lookup_token.lookup_terms.map(get_matches_from_ontology))).flat()

	const found_results = results.reduce(transform_results, [])
	const not_found_results = lookup_token.lookup_results.filter(lookup => !results.some(result => lookups_match(lookup, result)))
	lookup_token.lookup_results = found_results.concat(not_found_results)

	/**
	 * @param {LookupResult[]} transformed_results
	 * @param {OntologyResult} ontology_result
	 * @returns {LookupResult[]}
	 */
	function transform_results(transformed_results, ontology_result) {
		const existing_result = lookup_token.lookup_results.find(lookup => lookups_match(lookup, ontology_result))
		
		if (!existing_result && ontology_result.stem.toLowerCase() !== lookup_token.lookup_terms[0].toLowerCase()) {
			// Don't include new results that don't match the original token lookup term
			// eg. 'covering' should not match the noun 'cover', even though it matches the ontology search for the verb stem 'cover'
			return transformed_results
		}
		
		const form = existing_result?.form ?? 'stem'
		const result = create_lookup_result(ontology_result, { form, concept: ontology_result })
		transformed_results.push(result)
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

/**
 *
 * @param {LookupWord} lookup1
 * @param {LookupWord} lookup2
 * @returns {boolean}
 */
function lookups_match(lookup1, lookup2) {
	return lookup1.stem === lookup2.stem && lookup1.part_of_speech === lookup2.part_of_speech
}
