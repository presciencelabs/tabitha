import {pipe} from '$lib/pipeline'
import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE, create_error_token} from './token'
import {PRONOUN_RULES} from './pronoun_rules'
import {ERRORS} from './error_messages'

/**
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
export function check_syntax(tokens) {
	// prettier-ignore
	return pipe(
		check_invalid_tokens,
		check_for_unbalanced_brackets,
	)(tokens)
}

/**
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
export function check_invalid_tokens(tokens) {
	return tokens.map(check)

	/**
	 * @param {Token} token
	 * @returns {Token}
	 */
	function check(token) {
		// prettier-ignore
		const message = token.message
			|| check_for_pronouns(token)

		let type = message.length ? TOKEN_TYPE.ERROR : token.type
		return {
			...token,
			type,
			message,
		}
	}
}

/**
 * Pronouns can only be used under the right circumstances, e.g., `you(Paul)`.
 *
 * @param {Token} token
 * @returns {string} error message or ''
 */
function check_for_pronouns(token) {
	const normalized_token = token.token.toLowerCase()

	for (const [pronouns, message] of PRONOUN_RULES) {
		if (pronouns.includes(normalized_token)) {
			return message
		}
	}

	return ''
}

/**
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
export function check_for_unbalanced_brackets(tokens) {
	const all_brackets = stringify_brackets(tokens)

	// TODO balance brackets within each sentence

	const tracker = []
	for (const bracket of all_brackets) {
		if (bracket === '[') {
			tracker.push(bracket)
		} else {
			if (tracker.length === 0) {
				tokens = [create_error_token('[', ERRORS.MISSING_OPENING_BRACKET), ...tokens]
			} else {
				tracker.pop()
			}
		}
	}

	while (tracker.length > 0) {
		tokens.push(create_error_token(']', ERRORS.MISSING_CLOSING_BRACKET))

		tracker.pop()
	}

	return tokens

	/**
	 * @param {Token[]} tokens
	 * @returns {string} all brackets in order
	 */
	function stringify_brackets(tokens) {
		return tokens
			.filter(({token}) => REGEXES.OPENING_OR_CLOSING_BRACKET.test(token))
			.map(({token}) => token.match(REGEXES.OPENING_OR_CLOSING_BRACKET_G)?.join(''))
			.join('')
	}
}
