import {REGEXES} from '$lib/regexes'
import {CLAUSE_NOTATIONS} from './clause_notations'
import {PRONOUN_RULES} from './pronoun_rules'

/**
 * @param {Token[]} tokens
 * @returns {CheckedToken[]}
 */
export function check_syntax(tokens) {
	return tokens.map(check)

	/**
	 * @param {Token} token
	 * @returns {CheckedToken}
	 */
	function check(token) {
		// prettier-ignore
		const message = check_notes_notation(token)
			|| check_for_pronouns(token)
			|| check_subordinate_clause(token)
			|| check_clause_notation(token)

		return {
			token,
			message,
		}
	}
}

/**
 * Notes notation can only have a space before, e.g., `⎕_notesNotation`.
 *
 * @param {Token} token
 * @returns {string} error message or ''
 */
function check_notes_notation(token) {
	if (REGEXES.NON_WHITESPACE_BEFORE_UNDERSCORE.test(token)) {
		return 'Notes notation should have a space before the underscore, e.g., ⎕_implicit'
	}

	return ''
}

/**
 * Pronouns can only be used under the right circumstances, e.g., `you(Paul)`.
 *
 * @param {Token} token
 * @returns {string} error message or ''
 */
function check_for_pronouns(token) {
	const normalized_token = normalize(token)

	for (const [pronouns, message] of PRONOUN_RULES) {
		if (pronouns.includes(normalized_token)) {
			return message
		}
	}

	return ''

	/** @param {Token} token */
	function normalize(token) {
		const normalized = token.toLowerCase() // catches YOU, You, and any other mixed-case

		const match = normalized.match(REGEXES.ANY_WORD_EXCLUDE_OPEN_PAREN) // catches (you), [He, or others near punctuation, but not you(Paul), we(people), etc.

		return match ? match[1] : normalized
	}
}

/**
 * Subordinate clauses must begin with a space or another opening bracket before the opening bracket, e.g., `⎕[subordinate clause` or `[[subordinate clause`.
 * Not sure whether there are any rules about the closing bracket.  //TODO: follow-up on this question
 *
 * @param {Token} token
 * @returns {string} error message or ''
 */
function check_subordinate_clause(token) {
	if (REGEXES.UNACCEPTABLE_CHAR_BEFORE_OPENING_BRACKET.test(token)) {
		return 'Subordinate clauses should have a space or an opening bracket before the opening bracket, e.g., ⎕[subordinate clause or [[subordinate clause'
	}

	return ''
}

/**
 * Clause notations follow the pattern (keyword) or (keyword-subkeyword)
 *
 * @param {Token} token
 * @returns {string} error message or ''
 */
function check_clause_notation(token) {
	if (REGEXES.IS_CLAUSE_NOTATION.test(token) && !CLAUSE_NOTATIONS.includes(token)) {
		return 'This clause notation is not recognized.'
	}

	return ''
}
