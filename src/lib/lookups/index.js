import { TOKEN_TYPE, token_has_tag } from '../token'
import { REGEXES } from '../regexes'
import { create_context_filter, create_token_filter, from_built_in_rule, simple_rule_action } from '../rules/rules_parser'
import { apply_rule_to_tokens } from '../rules/rules_processor'
import { check_forms } from './form'
import { check_ontology } from './ontology'

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_form_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_for_lookup).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_forms))

	return sentences
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_ontology_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_for_lookup).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_ontology))

	result_filter_rules.map(from_built_in_rule('result_filter')).forEach(rule => apply_rule_to_tokens(lookup_tokens, rule))

	return sentences
}

/**
 * 
 * @param {Sentence} sentence 
 * @returns {Token[]}
 */
function flatten_for_lookup(sentence) {
	return flatten_tokens(sentence.clause)

	/**
	 * 
	 * @param {Token} token 
	 * @returns {Token[]}
	 */
	function flatten_tokens(token) {
		if (token.type === TOKEN_TYPE.CLAUSE) {
			return token.sub_tokens.flatMap(flatten_tokens)
		} else if (token.pairing) {
			return [token, token.pairing]
		}
		return [token]
	}
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
function is_lookup_token(token) {
	return token.type === TOKEN_TYPE.LOOKUP_WORD
}

/** @type {BuiltInRule[]} */
const result_filter_rules = [
	{
		name: 'Filter lookup results based on upper/lowercase for words not at the start of the sentence.',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !token_has_tag(token, { 'position': 'first_word' }),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token: token }) => {
				if (token.token !== 'null') {
					// 'null' is used for some double pairings like 'friends/brothers and null/sisters'.
					// But the concept in the ontology is NULL, so should not be filtered by capitalization
					filter_results_by_capitalization(token)
				}

				if (token.pairing) {
					filter_results_by_capitalization(token.pairing)
				}
			}),
		},
	},
	{
		name: 'Remove lookup results for certain functional Adpositions (up, down, etc)',
		comment: 'While these have an entry in the Ontology, they are only used in the Analyzer with specific Verbs. They should not be recognized as words on their own.',
		rule: {
			trigger: create_token_filter({ 'token': 'to|down|off|out|up' }),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token }) => {
				trigger_token.lookup_results = []
			}),
		},
	},
]

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
	token.lookup_results = starts_lowercase(token.token)
		? token.lookup_results.filter(result => starts_lowercase(result.stem))
		: token.lookup_results.filter(result => !starts_lowercase(result.stem))
}