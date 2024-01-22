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
		if (message || REGEXES.IS_SIGNAL_WORD.test(token)) {
			results.push({token, message})

			return results
		}

		results.push(...extract_punctuation(token))

		return results

		/**
		 * @param {string} token
		 * @returns {CheckedToken[]}
		 **/
		function extract_punctuation(token) {
			const tokens = []

			const matches = token.match(REGEXES.PUNCTUATION_GROUPING)

			if (matches === null) {
				tokens.push({token, message: ''})

				return tokens
			}

			/** @type {string} */
			const front_punctuations = matches[1] ?? ''
			front_punctuations.split('').map(punctuation => tokens.push({token: punctuation, message: ''}))

			/** @type {string} */
			const word = matches[2] ?? ''
			word && tokens.push({token: word, message: ''})

			/** @type {string} */
			const back_punctuations = matches[3] ?? ''
			back_punctuations.split('').map(punctuation => tokens.push({token: punctuation, message: ''}))

			return tokens
		}
	}
}
