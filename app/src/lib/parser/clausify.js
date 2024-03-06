import {REGEXES} from '$lib/regexes'
import {ERRORS} from './error_messages'
import {TOKEN_TYPE, create_clause_token, create_added_token, flatten_sentence} from './token'

/**
 * @param {Token[]} tokens
 * @returns {Sentence[]}
 */
export function clausify(tokens) {
	if (tokens.length === 0) {
		return []
	}

	/** @type {Sentence[]} */
	const sentences = []

	/** @type {Token[][]} */
	let clause_tokens = []
	let sentence_is_ending = false

	start_sentence()
	for (let token of tokens) {
		// sentences can end like ]. or .] or ."] etc
		if (sentence_is_ending && !is_clause_end_token(token)) {
			end_sentence()
			start_sentence()
		}

		if (token.token.includes('[')) {
			start_clause()
		}

		add_token_to_clause(token)
		
		if (token.token === ']') {
			end_clause()
		}

		if (is_sentence_end_token(token)) {
			sentence_is_ending = true
		}
	}

	if (!sentence_is_ending) {
		// add a 'missing period' error
		add_token_to_clause(create_added_token('.', {error: ERRORS.MISSING_PERIOD}))
	}

	end_sentence()

	return sentences

	/**
	 * 
	 * @param {Token} token 
	 */
	function add_token_to_clause(token) {
		clause_tokens[clause_tokens.length-1].push(token)
	}

	function start_sentence() {
		start_clause()
		sentence_is_ending = false
	}

	function end_sentence() {
		while (clause_tokens.length > 1) {
			add_token_to_clause(create_added_token(']', {error: ERRORS.MISSING_CLOSING_BRACKET}))
			end_clause()
		}

		const clause = create_clause()
		clause.tag = 'main_clause'
		sentences.push({ clause })
	}

	function start_clause() {
		// TODO if nesting depth is more than 3, suggest to rework the sentence
		clause_tokens.push([])
	}

	function end_clause() {
		if (clause_tokens.length === 1) {
			clause_tokens[0].splice(0, 0, create_added_token('[', {error: ERRORS.MISSING_OPENING_BRACKET}))
			return
		}

		add_token_to_clause(create_clause())
	}

	function create_clause() {
		// @ts-ignore
		return create_clause_token(clause_tokens.pop())
	}

	/**
	 * @param {Token} token
	 */
	function is_sentence_end_token(token) {
		return token.type === TOKEN_TYPE.PUNCTUATION && REGEXES.SENTENCE_ENDING_PUNCTUATION.test(token.token)
	}

	/**
	 * @param {Token} token
	 */
	function is_clause_end_token(token) {
		return token.type === TOKEN_TYPE.PUNCTUATION && REGEXES.CLAUSE_ENDING_PUNCTUATION.test(token.token)
	}
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Token[]}
 */
export function flatten_sentences(sentences) {
	return sentences.flatMap(flatten_sentence)
}