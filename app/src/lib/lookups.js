import {TOKEN_TYPE} from "./parser/token"

/**
 * 
 * @param {Token[]} tokens 
 */
export async function perform_ontology_lookups(tokens) {
	const lookup_tokens = tokens.flatMap(get_lookup_tokens)

	await Promise.all(lookup_tokens.map(check_ontology))

	return tokens

	/**
	 * 
	 * @param {Token} token 
	 * @returns {Token[]}
	 */
	function get_lookup_tokens(token) {
		if (token.type === TOKEN_TYPE.LOOKUP_WORD) {
			return [token]
		} else if (token.type === TOKEN_TYPE.PAIRING) {
			// @ts-ignore
			return [token.pairing_left, token.pairing_right]
		} else {
			return []
		}
	}
}

/**
 * @param {Token} lookup_token
 */
async function check_ontology(lookup_token) {
	const response = await fetch(`/lookup?word=${lookup_token.lookup_term}`)

	/** @type {LookupResult<OntologyResult>} */
	const results = await response.json()

	lookup_token.lookup_results = results.matches

	lookup_token.concept = results.matches.length === 1 ? results.matches[0] : null
}