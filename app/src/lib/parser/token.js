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
const CLAUSE = 'Clause'

export const TOKEN_TYPE = {
	ERROR,
	PUNCTUATION,
	NOTE,
	FUNCTION_WORD,
	LOOKUP_WORD,
	CLAUSE,
}

/**
 * 
 * @param {string} token 
 * @param {TokenType} type 
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.message=''] 
 * @param {string} [other_data.tag=''] 
 * @param {string} [other_data.lookup_term=''] 
 * @param {Token[]} [other_data.sub_tokens=[]] 
 * @param {Token?} [other_data.pairing=null] 
 * @param {Token?} [other_data.pronoun=null] 
 * @return {Token}
 */
export function create_token(token, type, {message='', tag='', lookup_term='', sub_tokens=[], pairing=null, pronoun=null}={}) {
	return {
		token,
		type,
		message,
		tag,
		lookup_term,
		form_results: [],
		lookup_results: [],
		sub_tokens,
		complex_pairing: pairing,
		pronoun,
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
		if (token.lookup_results.length > 0) {
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
	token.lookup_results = token.lookup_results.filter(result => result.stem === stem && result.sense === sense)
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
	return token.lookup_results.length > 0
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_error(token) {
	return token.type === TOKEN_TYPE.ERROR
		|| token.message.length > 0
		|| token.sub_tokens.some(token_has_error)
		|| token.complex_pairing !== null && token_has_error(token.complex_pairing)
		|| token.pronoun !== null && token_has_error(token.pronoun)
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
 * @param {OntologyResult} concept
 * @returns {string}
 */
export function concept_with_sense(concept) {
	return `${concept.stem}-${concept.sense}`
}
