import {create_context_filter, create_token_filter, create_token_modify_action} from './rules_parser'
import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE} from '$lib/parser/token'
import {ERRORS} from '$lib/parser/error_messages'

/**
 * These rules are hardcoded because they shouldn't need to be edited or added to by the user.
 * They don't need to be extendable, but are still able to be used within the rule system.
 */
/** @type {BuiltInRule[]} */
const builtin_syntax_rules = [
	{
		name: 'A subordinate clause is a Patient by default',
		comment: '',
		rule: {
			trigger: token_is_subordinate_clause,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				token.tag = 'patient_clause'
			}),
		},
	},
	{
		name: 'Set tag for quote clauses',
		comment: '',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'token': '"'})),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				token.tag = 'patient_clause|quote_begin'
			}),
		},
	},
	{
		name: 'Set tag for relative clauses based on relativizer',
		comment: 'removes extra tags for words like "who" and "which". "that" is handled again in the next rule',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'tag': 'relativizer'})),
			context: create_context_filter({ 'precededby': { 'category': 'Noun'} }),
			action: create_token_modify_action(token => {
				const relativizer = token.sub_tokens[1]
				if (relativizer.token === 'that') {
					// 'that' could also be a complementizer here
					token.tag = 'relative_clause|patient_clause'
					relativizer.tag = 'relativizer|complementizer'
				} else {
					token.tag = 'relative_clause'
					relativizer.tag = 'relativizer'
				}
			}),
		},
	},
	{
		name: 'Set tag for "that" when not preceded by a Noun',
		comment: '"that" can only be a complementizer in this case',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'token': 'that'})),
			context: create_context_filter({ 'notprecededby': { 'category': 'Noun' }}),
			action: create_token_modify_action(token => {
				token.tag = 'patient_clause'
				token.sub_tokens[1].tag = 'complementizer'
			}),
		},
	},
	{
		name: 'All Clauses that have adpositions are Adverbial clauses',
		comment: '',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'category': 'Adposition'})),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				token.tag = 'adverbial_clause'
			}),
		},
	},
	{
		name: 'Check capitalization for first word in a sentence or quote',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': 'main_clause|quote_begin' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// find first word token, even if nested in another clause
				const word_token = find_first_word(token)
				if (!word_token) {
					return
				}

				word_token.tag = word_token.tag ? `${word_token.tag}|first_word` : 'first_word'
				const token_to_test = word_token.pronoun ? word_token.pronoun : word_token

				if (starts_lowercase(token_to_test.token)) {
					token_to_test.error_message = token_to_test.error_message || ERRORS.FIRST_WORD_NOT_CAPITALIZED
				}
			}),
		},
	},
	{
		name: 'Filter lookup results based on upper/lowercase for words not at the start of the sentence.',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !token.tag.includes('first_word'),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				filter_results_by_capitalization(token)
				if (token.complex_pairing) {
					filter_results_by_capitalization(token.complex_pairing)
				}
			}),
		},
	},
	{
		name: 'Words with a pronoun must be a noun.',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && token.pronoun !== null,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				filter_results_by_part_of_speech(token, new Set(['Noun']))
			}),
		},
	},
	{
		name: "Tag words with a possessive 's as genitive_saxon",
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && REGEXES.HAS_POSSESSIVE.test(token.token),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				token.tag = token.tag ? `${token.tag}|genitive_saxon` : 'genitive_saxon'
			}),
		},
	},
	{
		name: 'Filter lookup results for pairings based on part of speech',
		comment: '',
		rule: {
			trigger: token => token.lookup_results.length > 0 && token.complex_pairing !== null && token.complex_pairing.lookup_results.length > 0,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				/** @type {Token[]} */
				// @ts-ignore
				const [left, right] = [token, token.complex_pairing]

				// filter lookup results based on the overlap of the two concepts
				const left_categories = new Set(left.lookup_results.map(result => result.part_of_speech))
				const right_categories = new Set(right.lookup_results.map(result => result.part_of_speech))
				const overlapping_categories = new Set([...left_categories].filter(x => right_categories.has(x)))

				if (overlapping_categories.size > 0) {
					filter_results_by_part_of_speech(left, overlapping_categories)
					filter_results_by_part_of_speech(right, overlapping_categories)
				} else {
					left.error_message = ERRORS.PAIRING_DIFFERENT_PARTS_OF_SPEECH
				}
			}),
		},
	},
]

export const SYNTAX_RULES = builtin_syntax_rules.map(({rule}) => rule)

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

/**
 * 
 * @param {Token} token 
 * @param {Set<string>} parts_of_speech 
 */
function filter_results_by_part_of_speech(token, parts_of_speech) {
	token.form_results = token.form_results.filter(result => parts_of_speech.has(result.part_of_speech))
	token.lookup_results = token.lookup_results.filter(result => parts_of_speech.has(result.part_of_speech))
}