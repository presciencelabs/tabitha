import {function_words, REGEXES} from '.'


/**
 * @param {CheckedToken} checked_token
 * @returns {Promise<LookupResult<OntologyResult>>}
 */
export async function check_ontology(checked_token) {
	if (bypass_lookup(checked_token)) {
		return {
			term: checked_token.token,
			matches: [],
		}
	}

	const normalized_word = remove_possessives(checked_token.token)

	if (REGEXES.IS_PRONOUN.test(normalized_word)) {
		const referent = normalized_word.match(REGEXES.EXTRACT_PRONOUN_REFERENT)?.[1]

		return await lookup(referent)
	}

	return await lookup(normalized_word)

	/**
	 * @param {CheckedToken} candidate_token
	 * @returns {boolean}
	 */
	function bypass_lookup(candidate_token) {
		const HAS_ERROR = !!candidate_token.message
		const NOTES_NOTATION = REGEXES.IS_NOTES_NOTATION.test(candidate_token.token)
		const CLAUSE_NOTATION = REGEXES.IS_CLAUSE_NOTATION.test(candidate_token.token)
		const IS_FUNCTION_WORD = function_words.includes(candidate_token.token)

		// prettier-ignore
		const conditions = [
			HAS_ERROR,
			NOTES_NOTATION,
			CLAUSE_NOTATION,
			IS_FUNCTION_WORD,
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

	/**
	 * @param {string} word
	 * @returns {string}
	 */
	function remove_possessives(word) {
		return word.replace(REGEXES.POSSESSIVE, '')
	}
}