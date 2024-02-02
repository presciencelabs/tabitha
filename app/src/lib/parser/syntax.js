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
		check_sentence_syntax,
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

/** @typedef {{start: number, end: number}} Sentence */

/**
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
export function check_sentence_syntax(tokens) {
	const new_tokens = tokens.slice()
	const sentences = find_and_check_sentences(new_tokens)

	// reverse the sentences so that the indices don't get messed up
	for (let sentence of sentences.reverse()) {
		check_capitalization(new_tokens, sentence)
		check_sentence_for_balanced_brackets(new_tokens, sentence)
	}

	return new_tokens

	/**
	 * @param {Token[]} tokens
	 * @param {Sentence} sentence 
	 */
	function check_capitalization(tokens, sentence) {
		const sentence_tokens = tokens.slice(sentence['start'], sentence['end'])

		find_and_check_first_word(sentence_tokens)

		// Check beginning of quotes ([")
		for (let i = 1; i < sentence_tokens.length; i++) {
			if (sentence_tokens[i-1].token === '[' && sentence_tokens[i].token === '"') {
				find_and_check_first_word(sentence_tokens.slice(i))
			}
		}

		/**
		 * @param {Token[]} slice 
		 */
		function find_and_check_first_word(slice) {
			/** @type {TokenType[]} */
			const word_types = [TOKEN_TYPE.LOOKUP_WORD, TOKEN_TYPE.PAIRING, TOKEN_TYPE.FUNCTION_WORD]
			const first_word = slice.find(({type}) => word_types.includes(type))
			
			if (first_word !== undefined && /^[a-z]/.test(first_word.token)) {
				first_word.type = TOKEN_TYPE.ERROR
				first_word.message = ERRORS.FIRST_WORD_NOT_CAPITALIZED
			}
		}
	}

	/**
	 * @param {Token[]} tokens
	 * @param {Sentence} sentence 
	 */
	function check_sentence_for_balanced_brackets(tokens, sentence) {
		const all_brackets = stringify_brackets(tokens, sentence)
	
		const tracker = []
		for (const bracket of all_brackets) {
			if (bracket === '[') {
				tracker.push(bracket)
			} else {
				if (tracker.length === 0) {
					tokens.splice(sentence['start'], 0, create_error_token('[', ERRORS.MISSING_OPENING_BRACKET))
				} else {
					tracker.pop()
				}
			}
		}
	
		while (tracker.length > 0) {
			tokens.splice(sentence['end'], 0, create_error_token(']', ERRORS.MISSING_CLOSING_BRACKET))
	
			tracker.pop()
		}
	
		return tokens
	}

	/**
	 * @param {Token[]} tokens
	 * @param {Sentence} sentence
	 * @returns {string} all brackets in order
	 */
	function stringify_brackets(tokens, sentence) {
		return tokens
			.slice(sentence['start'], sentence['end'])
			.map(({token}) => token.match(REGEXES.OPENING_OR_CLOSING_BRACKET)?.[1] ?? '')
			.join('')
	}
}

/**
 * @param {Token[]} tokens
 * @returns {Sentence[]}
 */
function find_and_check_sentences(tokens) {
	const sentences = []

	let start = 0
	let current = 0
	while (!is_at_end()) {
		if (is_sentence_end_token(tokens[current])) {
			advance()
			while (!is_at_end() && is_clause_end_token(tokens[current])) {
				advance()
			}
			sentences.push(collect_sentence())
		} else {
			advance()
		}
	}

	if (start !== current) {
		// add a 'missing period' error
		tokens.push(create_error_token('.', ERRORS.MISSING_PERIOD))
		sentences.push(collect_sentence())
	}

	return sentences
	
	/**
	 * @param {Token} token 
	 */
	function is_sentence_end_token(token) {
		return (token.type === TOKEN_TYPE.PUNCTUATION || token.type === TOKEN_TYPE.ERROR)
			&& REGEXES.SENTENCE_ENDING_PUNCTUATION.test(token.token)
	}

	/**
	 * @param {Token} token 
	 */
	function is_clause_end_token(token) {
		return token.type === TOKEN_TYPE.PUNCTUATION && REGEXES.CLAUSE_ENDING_PUNCTUATION.test(token.token)
	}

	function collect_sentence() {
		const sentence = {start, end: current}
		start = current
		return sentence
	}

	function advance() {
		current++
	}

	function is_at_end() {
		return current >= tokens.length
	}
}
