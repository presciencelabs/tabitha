import {TOKEN_TYPE} from './token'

/**
 * @typedef {[token: string, context: string[], transform: (token: Token) => Token]} TokenTransform
 */

/**
 * These are words that may change their underlying data based on the context around them.
 * In future, these could look at the lookup results of the surrounding tokens (ie syntactic category)
 * and could be used to decide between senses.
 * These transform rules could be extended and could become their own meta-language similar
 * to the existing Analyzer rules.
 * 
 * @type {TokenTransform[]}
 */
const TOKEN_TRANSFORMS = [
	['do', ['not'], set_token_type(TOKEN_TYPE.FUNCTION_WORD)],
	['because', ['of'], set_token_lookup('because-B')],
]

/**
 * @param {TokenType} type 
 * @returns {(token: Token) => Token}
 */
function set_token_type(type) {
	return (token) => ({...token, type})
}

/**
 * @param {string} lookup_term 
 * @returns {(token: Token) => Token}
 */
function set_token_lookup(lookup_term) {
	return (token) => ({...token, lookup_term})
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[]}
 */
export function transform_tokens(tokens) {
	const new_tokens = []

	let current = 0
	while (current < tokens.length) {
		new_tokens.push(create_next_token())
	}

	return new_tokens

	/**
	 * 
	 * @returns {Token}
	 */
	function create_next_token() {
		if (tokens[current].type != TOKEN_TYPE.LOOKUP_WORD) {
			return tokens[current++]
		}

		const transform = TOKEN_TRANSFORMS.find(matches_transform)?.[2] ?? (token => token)
		return transform(tokens[current++])
	}

	/**
	 * @param {TokenTransform} transform
	 */
	function matches_transform([token, context]) {
		return peek_match(token) && context.every((value, i) => peek_match(value, i+1))
	}

	/**
	 * @param {string} value 
	 * @param {number} offset 
	 */
	function peek_match(value, offset=0) {
		return (current + offset) < tokens.length
			&& value == tokens[current+offset].token.toLowerCase()
	}
}