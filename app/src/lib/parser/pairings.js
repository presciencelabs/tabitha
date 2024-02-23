import {REGEXES} from '$lib/regexes'
import {ERRORS} from './error_messages'
import {TOKEN_TYPE, check_token_lookup} from './token'

/**
 *
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
export function check_pairings(tokens) {
	tokens.filter(token => token.type === TOKEN_TYPE.PAIRING).forEach(check_pairing)

	return tokens

	/**
	 *
	 * @param {Token} token
	 */
	function check_pairing(token) {
		const [left, right] = token.sub_tokens
		if (check_token_lookup(concept => REGEXES.IS_LEVEL_COMPLEX.test(`${concept.level}`))(left)) {
			token.sub_tokens[0] = {
				...left,
				type: TOKEN_TYPE.ERROR,
				message: ERRORS.WORD_LEVEL_TOO_HIGH,
			}
		}
		if (check_token_lookup(concept => REGEXES.IS_LEVEL_SIMPLE.test(`${concept.level}`))(right)) {
			token.sub_tokens[1] = {
				...right,
				type: TOKEN_TYPE.ERROR,
				message: ERRORS.WORD_LEVEL_TOO_LOW,
			}
		}
	}
}