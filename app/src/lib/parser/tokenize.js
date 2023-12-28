import {REGEXES} from '$lib'

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function tokenize_input(text = '') {
	return text
		.split(REGEXES.ANY_WHITESPACE)
		.filter(not_empty)
		.map(token => token)

	/** @param {string} text */
	function not_empty(text) {
		return !!text.trim()
	}
}

/**
 * @param {CheckedToken[]} checked_tokens
 * @returns {CheckedToken[]}
 */
export function tokenize_punctuation(checked_tokens) {
	return checked_tokens.reduce(tokenizer, [])

	/**
	 *
	 * @param {CheckedToken[]} results
	 * @param {CheckedToken} next_token
	 * @returns {CheckedToken[]}
	 */
	function tokenizer(results, {token, message}) {
		if (message) {
			results.push({token, message})

			return results
		}

		const token_remains = parse_front_of_token()
		token_remains && parse_back_of_token(token_remains)

		return results

		/**
		 * at this time, '[' is the only "opening" punctuation of relevance
		 */
		function parse_front_of_token() {
			if (token[0] === '[') {
				results.push({token: '[', message: ''})

				return token.slice(1) || ''
			}

			return token
		}

		/**
		 * at this time, ']', ',', '.' are the only "closing" punctuations of relevance
		 * @param {string} remains
		 */
		function parse_back_of_token(remains) {
			const matches = remains.match(REGEXES.RELEVANT_CLOSING_PUNCTUATION)

			if (matches === null) {
				results.push({token: remains, message: ''})
			} else {
				// split 'some_token]', 'some_token].', 'some_token]],', ...(many permutations) into multiple tokens
				const everything_except_punctuation = matches[1] // 'some_token'
				results.push({token: everything_except_punctuation, message: ''})

				const punctuation_that_matched = matches[2] // ']' or '].' or ']],' respectively
				punctuation_that_matched.split('').forEach(punct => results.push({token: punct, message: ''}))
			}
		}
	}
}
