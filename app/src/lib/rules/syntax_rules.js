import { ERRORS } from '$lib/parser/error_messages'
import { TOKEN_TYPE, add_tag_to_token } from '$lib/parser/token'
import { REGEXES } from '$lib/regexes'
import { PRONOUN_RULES } from './pronoun_rules'
import { create_context_filter, create_token_filter, create_token_modify_action } from './rules_parser'

/**
 * These rules are for tagging tokens based on the syntax. These cannot rely on any lookup data.
 */
/** @type {BuiltInRule[]} */
const builtin_syntax_rules = [
	{
		name: 'Set tag for quote clauses',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': 'subordinate_clause' }),
			context: create_context_filter({ 'subtokens': { 'token': '"', 'skip': { 'token': '[' } } }),
			action: create_token_modify_action(token => {
				token.tag = 'patient_clause_quote_begin'
			}),
		},
	},
	{
		name: 'Set tag for first words of sentences',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': 'main_clause|patient_clause_quote_begin' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// find first word token, even if nested in another clause
				const word_token = find_first_word(token)
				if (!word_token) {
					return
				}

				add_tag_to_token(word_token, 'first_word')
			}),
		},
	},
	{
		name: 'Check capitalization for first word in a sentence or quote',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': 'first_word' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// While this check may make more sense in the checker rules, it must be done here
				// before the 'first_word' tag possibly gets overwritten in the transform rules.
				// TODO expand the 'tag' system so things don't get overwritten?
				const token_to_test = token.pronoun ? token.pronoun : token
				if (starts_lowercase(token_to_test.token)) {
					token_to_test.error_message = token_to_test.error_message || ERRORS.FIRST_WORD_NOT_CAPITALIZED
				}
			}),
		},
	},
	{
		name: "Set tag for words with possessive 's  as genitive_saxon",
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && REGEXES.HAS_POSSESSIVE.test(token.token),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				add_tag_to_token(token, 'genitive_saxon')
			}),
		},
	},
]

export const SYNTAX_RULES = builtin_syntax_rules.map(({ rule }) => rule).concat(PRONOUN_RULES)

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