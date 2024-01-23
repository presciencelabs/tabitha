import {REGEXES} from './regexes'

/**
 * @param {CheckedToken} checked_token
 * @returns {Promise<LookupResult<OntologyResult>>}
 */
export async function check_ontology(checked_token) {
	if (bypass(checked_token)) {
		return {
			term: checked_token.token,
			matches: [],
		}
	}

	if (REGEXES.IS_PRONOUN.test(checked_token.token)) {
		const word = checked_token.token.match(REGEXES.EXTRACT_PRONOUN_REFERENT)?.[1]

		return await lookup(word)
	}
	// if it's
	// 	not a pronoun...
	// 	not an alternate form of a complex word...
	// 	not a word perhaps???
	// then look up
	// const response = await fetch(`/lookup?word=${checked_token.token}`)

	return await lookup(checked_token.token) //response.json()

	/**
	 * @param {CheckedToken} candidate_token
	 * @returns {boolean}
	 */
	function bypass(candidate_token) {
		const HAS_ERROR = !!candidate_token.message
		const SP_NOTATION = candidate_token.token.startsWith('_')
		const SIGNAL_WORD = REGEXES.IS_SIGNAL_WORD.test(candidate_token.token)

		// prettier-ignore
		const conditions = [
			HAS_ERROR,
			SP_NOTATION,
			SIGNAL_WORD,
		]

		return conditions.some(condition => condition)
	}

	/**
	 * @param {string} word
	 * @returns {Promise<LookupResult<OntologyResult>>}
	 */
	async function lookup(word = '') {
		const response = await fetch(`/lookup?word=${word}`)

		return await response.json()
	}
}
