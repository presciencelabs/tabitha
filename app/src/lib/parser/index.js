import { pipe } from '$lib/pipeline'
import { tokenize_input } from './tokenize'
import { perform_form_lookups, perform_ontology_lookups } from '$lib/lookups'
import { clausify, flatten_sentences } from './clausify'
import { CHECKER_RULES, LOOKUP_RULES, PART_OF_SPEECH_RULES, SYNTAX_RULES, TRANSFORM_RULES, PRONOUN_RULES, rules_applier } from '$lib/rules'

/**
 * @param {string} text
 * @returns {Promise<Token[]>}
 */
export async function parse(text) {
	const pre_lookups = pipe(
		tokenize_input,
		clausify,
		rules_applier(PRONOUN_RULES),
	)(text)

	const with_forms = await perform_form_lookups(pre_lookups)
	const with_transformed_lookups = rules_applier(LOOKUP_RULES)(with_forms)
	const with_lookups = await perform_ontology_lookups(with_transformed_lookups)

	return pipe(
		rules_applier(SYNTAX_RULES),
		rules_applier(PART_OF_SPEECH_RULES),
		rules_applier(TRANSFORM_RULES),
		rules_applier(CHECKER_RULES),
		flatten_sentences,
	)(with_lookups)
}

/**
 * TODO: temporary... need to build e2e testing infrastructure
 * 
 * @param {string} text
 * @returns {Token[]}
 */
export function parse_for_test(text) {
	return pipe(
		tokenize_input,
		clausify,
		rules_applier(PRONOUN_RULES),
		rules_applier(LOOKUP_RULES),
		rules_applier(SYNTAX_RULES),
		rules_applier(PART_OF_SPEECH_RULES),
		rules_applier(TRANSFORM_RULES),
		rules_applier(CHECKER_RULES.slice(0,4)),	// TODO remove slice when e2e testing is set up (skips the 'no lookup' check)
		flatten_sentences,
	)(text)
}
