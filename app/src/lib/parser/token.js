import { REGEXES } from '$lib/regexes'

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

/** @type {TokenType} */
const ADDED = 'Added'

export const TOKEN_TYPE = {
	PUNCTUATION,
	NOTE,
	FUNCTION_WORD,
	LOOKUP_WORD,
	CLAUSE,
	ADDED,
}

/**
 * 
 * @param {string} token 
 * @param {TokenType} type 
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.error=''] 
 * @param {string} [other_data.suggest=''] 
 * @param {string} [other_data.tag=''] 
 * @param {string} [other_data.lookup_term=''] 
 * @param {Token[]} [other_data.sub_tokens=[]] 
 * @param {Token?} [other_data.pairing=null] 
 * @param {Token?} [other_data.pronoun=null] 
 * @return {Token}
 */
export function create_token(token, type, { error='', suggest= '', tag='', lookup_term='', sub_tokens=[], pairing=null, pronoun=null }={}) {
	return {
		token,
		type,
		error_message: error,
		suggest_message: suggest,
		tag,
		lookup_terms: lookup_term ? [lookup_term] : [],
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
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.error=''] 
 * @param {string} [other_data.suggest=''] 
 * @returns {Token}
 */
export function create_added_token(token, { error='', suggest='' }={}) {
	return create_token(token, TOKEN_TYPE.ADDED, { error, suggest })
}

/**
 * 
 * @param {Token} token 
 * @param {string} message 
 * @returns {Token}
 */
export function convert_to_error_token(token, message) {
	return { ...token, error_message: message }
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
	// If a specific sense is already selected, don't overwrite it
	if (token.lookup_results.length <= 1) {
		return token
	}

	const { stem, sense } = split_stem_and_sense(concept)
	token.lookup_terms = [concept]
	token.lookup_results = token.lookup_results.filter(result => result.stem === stem && result.sense === sense)
	return token

	/**
	 * 
	 * @param {string} term 
	 * @returns {{stem: string, sense: string}}
	 */
	function split_stem_and_sense(term) {
		/** @type {RegExpMatchArray} */
		// @ts-ignore the match will always succeed
		const match = term.match(REGEXES.EXTRACT_STEM_AND_SENSE)
		return { stem: match[1], sense: match[2] ?? '' }
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
	return token.error_message.length > 0
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_message(token) {
	return token.error_message.length > 0 || token.suggest_message.length > 0
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
