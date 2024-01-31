/**
 * @param {Token} lookup_token
 * @returns {Promise<LookupResult<OntologyResult>>}
 */
export async function check_ontology(lookup_token) {
	const response = await fetch(`/lookup?word=${lookup_token.lookup_term}`)
	return await response.json()
}