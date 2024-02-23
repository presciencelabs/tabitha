import {TOKEN_TYPE, create_error_token, find_token_nested} from './token'
import {PRONOUN_RULES} from './pronoun_rules'
import {ERRORS} from './error_messages'
import {REGEXES} from '$lib/regexes'

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[]}
 */
export function check_for_pronouns(tokens) {
	return tokens.map(check)

	/**
	 * 
	 * @param {Token} token 
	 */
	function check(token) {
		if (token.type === TOKEN_TYPE.ERROR) {
			return token
		}

		const normalized_token = token.token.toLowerCase()

		for (const [pronouns, message] of PRONOUN_RULES) {
			if (pronouns.includes(normalized_token)) {
				return create_error_token(token.token, message)
			}
		}

		return token
	}
}

/**
 * @param {Sentence[]} sentences
 * @returns {Sentence[]}
 */
export function check_capitalization(sentences) {
	return sentences.map(check_sentence)

	/**
	 * 
	 * @param {Sentence} sentence 
	 */
	function check_sentence(sentence) {
		find_and_check_first_word(sentence.clause)

		// Check beginning of quotes ([")
		const quote_clause = find_token_nested(sentence.clause, token_is_quote_clause)
		if (quote_clause) {
			find_and_check_first_word(quote_clause)
		}

		return sentence
	}

	/**
	 * @param {Clause} clause
	 */
	function find_and_check_first_word(clause) {
		const first_word = find_token_nested(clause, token_is_word)

		if (first_word !== undefined && /^[a-z]/.test(first_word.token)) {
			first_word.type = TOKEN_TYPE.ERROR
			first_word.message = first_word.message || ERRORS.FIRST_WORD_NOT_CAPITALIZED
		}
	}

	/**
	 * 
	 * @param {Token} token 
	 * @returns {boolean}
	 */
	function token_is_word(token) {
		/** @type {TokenType[]} */
		const word_types = [TOKEN_TYPE.LOOKUP_WORD, TOKEN_TYPE.PAIRING, TOKEN_TYPE.FUNCTION_WORD]

		return word_types.includes(token.type)
			|| token.token.length > 0 && REGEXES.WORD_START_CHAR.test(token.token[0])
	}

	/**
	 * 
	 * @param {Token} token 
	 */
	function token_is_quote_clause(token) {
		return token.type === TOKEN_TYPE.CLAUSE
			&& token.sub_tokens.length > 1
			&& token.sub_tokens[1].token === '"'
	}
}
