import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE, check_token_lookup, create_error_token} from './token'

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
		if (token.pairing_left &&
			check_token_lookup(concept => REGEXES.IS_LEVEL_COMPLEX.test(`${concept.level}`))(token.pairing_left)) {
			token.pairing_left = create_error_token(token.pairing_left.token, 'Word must be a level 0 or 1')
		}
		if (token.pairing_right &&
			check_token_lookup(concept => REGEXES.IS_LEVEL_SIMPLE.test(`${concept.level}`))(token.pairing_right)) {
			token.pairing_right = create_error_token(token.pairing_right.token, 'Word must be a level 2 or 3')
		}
	}
}