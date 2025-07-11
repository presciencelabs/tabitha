import { TOKEN_TYPE, add_tag_to_token, create_token } from '$lib/token'
import { REGEXES } from '$lib/regexes'
import { PRONOUN_RULES } from './pronoun_rules'
import { create_context_filter, create_token_filter, simple_rule_action } from './rules_parser'

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
			action: simple_rule_action(({ trigger_token }) => {
				add_tag_to_token(trigger_token, { 'clause_type': 'patient_clause_quote_begin' })
			}),
		},
	},
	{
		name: 'Set tag for first words of sentences',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'main_clause|patient_clause_quote_begin' } }),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token }) => {
				// find first word token, even if nested in another clause
				const word_token = find_first_word(trigger_token)
				if (!word_token) {
					return
				}

				add_tag_to_token(word_token, { 'position': 'first_word' })
				if (word_token.complex_pairing) {
					add_tag_to_token(word_token.complex_pairing, { 'position': 'first_word' })
				}
			}),
		},
	},
	{
		name: "Set tag for words with possessive 's as genitive_saxon",
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && REGEXES.HAS_POSSESSIVE.test(token.token),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token }) => {
				add_tag_to_token(trigger_token, { 'relation': 'genitive_saxon' })
			}),
		},
	},
	{
		name: 'Tag numbers at the start of a verse references',
		comment: '',
		rule: {
			trigger: token => /^\d/.test(token.token),
			context: create_context_filter({
				'followedby': { 'tag': { 'syntax': 'verse_ref_colon' } },
			}),
			action: simple_rule_action(({ trigger_token }) => {
				add_tag_to_token(trigger_token, { 'role': 'verse_ref' })
			}),
		},
	},
	{
		name: 'Tag and/or split numbers at the end of a verse references',
		comment: '',
		rule: {
			trigger: token => /^\d/.test(token.token),
			context: create_context_filter({
				'precededby': { 'tag': { 'syntax': 'verse_ref_colon' } },
			}),
			action: ({ tokens, trigger_index, trigger_token }) => {
				if (trigger_token.token.includes('-')) {
					// this is a verse range (eg. Jeremiah 31:31-34)
					const verse_numbers = trigger_token.token.split('-')

					tokens.splice(trigger_index, 1,
						create_token(verse_numbers[0], TOKEN_TYPE.LOOKUP_WORD, {
							lookup_term: verse_numbers[0],
							tag: { 'role': 'verse_ref' },
						}),
						create_token('-', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'syntax': 'verse_ref_hyphen' } }),
						create_token(verse_numbers[1], TOKEN_TYPE.LOOKUP_WORD, {
							lookup_term: verse_numbers[1],
							tag: { 'role': 'verse_ref' },
						}),
					)
					return trigger_index + 3	// add 2 and advance 1
				}

				add_tag_to_token(trigger_token, { 'role': 'verse_ref' })

				return trigger_index + 1
			},
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