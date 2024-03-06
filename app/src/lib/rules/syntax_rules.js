import {create_context_filter, create_token_filter} from './rules_parser'
import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE} from '$lib/parser/token'
import {ERRORS} from '$lib/parser/error_messages'

/** @typedef {{name: string, comment: string, rule: TokenRule}} HardCodedRule */

/**
 * These rules are hardcoded because they shouldn't need to be edited or added to by the user.
 * They don't need to be extendable, but are still able to be used within the rule system.
 */
/** @type {HardCodedRule[]} */
const syntax_rule_info = [
	{
		name: 'A subordinate clause is a Patient by default',
		comment: '',
		rule: {
			trigger: token_is_subordinate_clause,
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'patient_clause'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for quote clauses',
		comment: '',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'token': '"'})),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'patient_clause|quote_begin'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for relative clauses based on relativizer',
		comment: 'removes extra tags for words like "who" and "which". "that" is handled again in the next rule',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'tag': 'relativizer'})),
			context: create_context_filter({ 'precededby': { 'category': 'Noun'} }),
			action: (tokens, trigger_index) => {
				const relativizer = tokens[trigger_index].sub_tokens[1]
				if (relativizer.token === 'that') {
					// 'that' could also be a complementizer here
					tokens[trigger_index].tag = 'relative_clause|patient_clause'
					relativizer.tag = 'relativizer|complementizer'
				} else {
					tokens[trigger_index].tag = 'relative_clause'
					relativizer.tag = 'relativizer'
				}

				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for "that" when not preceded by a Noun',
		comment: '"that" can only be a complementizer in this case',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'token': 'that'})),
			context: create_context_filter({ 'notprecededby': { 'category': 'Noun' }}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'patient_clause'
				tokens[trigger_index].sub_tokens[1].tag = 'complementizer'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'All Clauses that have adpositions are Adverbial clauses',
		comment: '',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'category': 'Adposition'})),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'adverbial_clause'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Check capitalization for first word in a sentence or quote',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': 'main_clause|quote_begin' }),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				// find first word token, even if nested in another clause
				const word_token = find_first_word(tokens[trigger_index])
				if (!word_token) {
					return trigger_index + 1
				}

				word_token.tag = word_token.tag ? `${word_token.tag}|first_word` : 'first_word'
				test_token(word_token.pronoun ? word_token.pronoun : word_token)
				return trigger_index + 1

				/**
				 * 
				 * @param {Token} token 
				 */
				function test_token(token) {
					if (starts_lowercase(token.token)) {
						token.error_message = token.error_message || ERRORS.FIRST_WORD_NOT_CAPITALIZED
					}
				}
			},
		},
	},
	{
		name: 'Filter lookup results based on upper/lowercase for words not at the start of the sentence.',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !token.tag.includes('first_word'),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				const token = tokens[trigger_index]
				filter_results_by_capitalization(token)
				if (token.complex_pairing) {
					filter_results_by_capitalization(token.complex_pairing)
				}
				return trigger_index + 1
			},
		},
	},
]

export const SYNTAX_RULES = syntax_rule_info.map(({rule}) => rule)

/**
 * 
 * @param {Token} token 
 */
function token_is_subordinate_clause(token) {
	return token.type === TOKEN_TYPE.CLAUSE && !token.tag.includes('main_clause')
}

/**
 * 
 * @param {TokenFilter} first_token_filter 
 * @returns {TokenFilter}
 */
function subordinate_clause_starts_with(first_token_filter) {
	return clause => clause.type === TOKEN_TYPE.CLAUSE
		&& !clause.tag.includes('main_clause')
		&& clause.sub_tokens.length > 1
		&& first_token_filter(clause.sub_tokens[1])		// skip the '['
}

/**
 * 
 * @param {Token} token 
 * @returns {Token|undefined}
 */
export function find_first_word(token) {
	if (token_is_word(token)) {
		return token
	}
	for (let sub_token of token.sub_tokens) {
		const result = find_first_word(sub_token)
		if (result) {
			return result
		}
	}
	return undefined

	/**
	 * 
	 * @param {Token} token 
	 * @returns {boolean}
	 */
	function token_is_word(token) {
		/** @type {TokenType[]} */
		const word_types = [TOKEN_TYPE.LOOKUP_WORD, TOKEN_TYPE.FUNCTION_WORD]

		return word_types.includes(token.type)
			|| token.token.length > 0 && REGEXES.WORD_START_CHAR.test(token.token[0])
	}
}

/**
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function starts_lowercase(text) {
	return REGEXES.STARTS_LOWERCASE.test(text)
}

/**
 * 
 * @param {Token} token 
 */
function filter_results_by_capitalization(token) {
	// filter results based on capitalization
	token.lookup_results = starts_lowercase(token.token)
		? token.lookup_results.filter(result => starts_lowercase(result.stem))
		: token.lookup_results.filter(result => !starts_lowercase(result.stem))
}