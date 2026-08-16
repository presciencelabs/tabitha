import { tokenize_input } from './tokenize'
import { perform_form_lookups, perform_ontology_lookups } from '$lib/lookups'
import { clausify, flatten_sentences } from './clausify'
import { RULES, rules_applier } from '$lib/rules'

export async function parse(text: string): Promise<Sentence[]> {
	let sentences = clausify(tokenize_input(text))
	sentences = rules_applier(RULES.SYNTAX)(sentences)
	sentences = await perform_form_lookups(sentences)
	sentences = rules_applier(RULES.LOOKUP)(sentences)
	sentences = await perform_ontology_lookups(sentences)
	sentences = rules_applier(RULES.PART_OF_SPEECH)(sentences)
	sentences = rules_applier(RULES.TRANSFORM)(sentences)
	return rules_applier(RULES.ARGUMENT_AND_SENSE)(sentences)
}

/**
 * TODO: temporary... need to build e2e testing infrastructure
 */
export function parse_for_test(text: string): Token[] {
	let sentences = clausify(tokenize_input(text))
	sentences = rules_applier(RULES.SYNTAX)(sentences)
	sentences = rules_applier(RULES.LOOKUP)(sentences)
	sentences = rules_applier(RULES.PART_OF_SPEECH)(sentences)
	sentences = rules_applier(RULES.TRANSFORM)(sentences)
	sentences = rules_applier(RULES.ARGUMENT_AND_SENSE)(sentences)
	sentences = rules_applier(RULES.CHECKER.slice(0, 5))(sentences)
	return flatten_sentences(sentences)
}
