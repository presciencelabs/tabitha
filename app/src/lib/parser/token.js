/** @type {TokenType} */
const ERROR = 'Error'

/** @type {TokenType} */
const PUNCTUATION = 'Punctuation'

/** @type {TokenType} */
const NOTE = 'Note'

/** @type {TokenType} */
const FUNCTION_WORD = 'FunctionWord'

/** @type {TokenType} */
const LOOKUP_WORD = 'Word'

/** @type {TokenType} */
const PAIRING = 'Pairing'

/** @type {TokenType} */
const CLAUSE = 'Clause'

export const TOKEN_TYPE = {
	ERROR,
	PUNCTUATION,
	NOTE,
	FUNCTION_WORD,
	LOOKUP_WORD,
	PAIRING,
	CLAUSE,
}

/**
 * 
 * @param {string} token 
 * @param {TokenType} type 
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.message=''] 
 * @param {string} [other_data.lookup_term=''] 
 * @param {Token[]} [other_data.sub_tokens=[]] 
 * @return {Token}
 */
export function create_token(token, type, {message='', lookup_term='', sub_tokens=[]}={}) {
	return {
		token,
		type,
		message,
		lookup_term,
		concept: null,
		lookup_results: [],
		sub_tokens,
	}
}

/**
 * 
 * @param {string} token 
 * @param {string} message 
 * @returns {Token}
 */
export function create_error_token(token, message) {
	return create_token(token, TOKEN_TYPE.ERROR, { message })
}

/**
 * 
 * @param {Token[]} sub_tokens 
 */
export function create_clause_token(sub_tokens) {
	return create_token('', TOKEN_TYPE.CLAUSE, { sub_tokens })
}

/**
 * 
 * @param {LookupFilter} lookup_check 
 * @returns {TokenFilter}
 */
export function check_token_lookup(lookup_check) {
	return token => {
		if (token.concept) {
			return lookup_check(token.concept)
		} else if (token.lookup_results.length > 0) {
			return token.lookup_results.every(concept => lookup_check(concept))
		} else {
			return false
		}
	}
}

/**
 * 
 * @param {Token} token 
 * @param {string} concept must include the sense
 * @returns {Token}
 */
export function set_token_concept(token, concept) {
	const [stem, sense] = split_concept()

	token.lookup_term = concept
	const matched_result = token.lookup_results.find(result => result.stem === stem && result.sense === sense)

	if (matched_result) {
		token.concept = matched_result
	} else {
		// TODO lookup in the ontology
		token.concept = {
			id: '0',
			stem,
			sense,
			part_of_speech: '',
			level: 1,
			gloss: '',
		}
	}

	return token

	function split_concept() {
		const dash = concept.lastIndexOf('-')
		const stem = concept.substring(0, dash)
		const sense = concept.substring(dash+1)
		return [stem, sense]
	}
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_concept(token) {
	return token.concept !== null || token.lookup_results.length > 0
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_error(token) {
	return token.type === TOKEN_TYPE.ERROR
		|| token.sub_tokens.some(token_has_error)
}

/**
 * 
 * @param {Token} token 
 * @returns {Token[]}
 */
export function flatten_token(token) {
	if (token.type === TOKEN_TYPE.CLAUSE) {
		return token.sub_tokens.flatMap(flatten_token)
	}
	return [token]
}

/**
 * 
 * @param {Sentence} sentence 
 * @returns {Token[]}
 */
export function flatten_sentence(sentence) {
	return flatten_token(sentence.clause)
}

/**
 * 
 * @param {Token} token 
 * @param {TokenFilter} predicate
 * @returns {Token|undefined}
 */
export function find_token_nested(token, predicate) {
	if (predicate(token)) {
		return token
	}
	for (let sub_token of token.sub_tokens) {
		const result = find_token_nested(sub_token, predicate)
		if (result) {
			return result
		}
	}
	return undefined
}
