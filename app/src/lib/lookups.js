import {TOKEN_TYPE, flatten_sentence} from './parser/token'

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_ontology_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_sentence).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_ontology))

	return sentences

	/**
	 * 
	 * @param {Token} token 
	 * @returns {boolean}
	 */
	function is_lookup_token(token) {
		return token.type === TOKEN_TYPE.LOOKUP_WORD
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