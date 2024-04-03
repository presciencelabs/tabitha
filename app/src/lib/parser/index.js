import { pipe, pipe_async } from '$lib/pipeline'
import { tokenize_input } from './tokenize'
import { perform_form_lookups, perform_ontology_lookups } from '$lib/lookups'
import { clausify, flatten_sentences } from './clausify'
import { RULES, rules_applier } from '$lib/rules'

/**
 * @param {string} text
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {Promise<Sentence[]>}
 */
export async function parse(text, db) {
	return await pipe_async(
		tokenize_input,
		clausify,
		rules_applier(RULES.SYNTAX),
		perform_form_lookups(db),
		rules_applier(RULES.LOOKUP),
		perform_ontology_lookups,
		rules_applier(RULES.PART_OF_SPEECH),
		rules_applier(RULES.TRANSFORM),
		rules_applier(RULES.CASE_FRAME),
		rules_applier(RULES.SENSE),
		rules_applier(RULES.CHECKER),
	)(text)
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
		rules_applier(RULES.SYNTAX),
		rules_applier(RULES.LOOKUP),
		rules_applier(RULES.PART_OF_SPEECH),
		rules_applier(RULES.TRANSFORM),
		rules_applier(RULES.CASE_FRAME),
		rules_applier(RULES.SENSE),
		rules_applier(RULES.CHECKER.slice(0,4)),	// TODO remove slice when e2e testing is set up (skips the 'no lookup' check)
		flatten_sentences,
	)(text)
}
