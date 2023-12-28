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

	const response = await fetch(`/lookup?word=${checked_token.token}`)

	return await response.json()

	/**
	 * @param {CheckedToken} candidate_token
	 * @returns {boolean}
	 */
	function bypass(candidate_token) {
		const HAS_ERROR = !!candidate_token.message
		const NOT_A_WORD = !REGEXES.IS_A_WORD.test(candidate_token.token)
		const SP_NOTATION = candidate_token.token.startsWith('_')

		// prettier-ignore
		const conditions = [
			HAS_ERROR,
			NOT_A_WORD,
			SP_NOTATION,
		]

		return conditions.some(condition => condition)
	}
}
