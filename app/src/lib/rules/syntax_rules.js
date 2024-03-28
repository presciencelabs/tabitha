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
			trigger: create_token_filter({ 'tag': { 'clause_type': 'subordinate_clause' } }),
			context: create_context_filter({ 'subtokens': { 'token': '"', 'skip': { 'token': '[' } } }),
			action: create_token_modify_action(token => {
				add_tag_to_token(token, { 'clause_type': 'patient_clause_quote_begin' })
			}),
		},
	},
	{
		name: 'Set tag for first words of sentences',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'main_clause|patient_clause_quote_begin' } }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// find first word token, even if nested in another clause
				const word_token = find_first_word(token)
				if (!word_token) {
					return
				}

				add_tag_to_token(word_token, { 'position': 'first_word' })
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
				add_tag_to_token(token, { 'relation': 'genitive_saxon' })
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