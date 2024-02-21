import {pipe} from '$lib/pipeline'
import {tokenize_input} from './tokenize'
import {check_syntax} from './syntax'
import {use_alternate_lookups} from './alternate_lookups'
import {apply_transform_rules, apply_checker_rules} from '../rules/rules_processor'
import {perform_ontology_lookups} from '$lib/lookups'
import {check_pairings} from './pairings'

/**
 * @param {string} text
 * @returns {Promise<Token[]>}
 */
export async function parse(text) {
	const pre_lookups = pipe(
		tokenize_input,
		check_syntax,
		use_alternate_lookups,
	)(text)

	const with_lookups = await perform_ontology_lookups(pre_lookups)

	return pipe(
		apply_transform_rules,
		apply_checker_rules,
		check_pairings,
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
		check_syntax,
		use_alternate_lookups,
		apply_transform_rules,
		apply_checker_rules,
		check_pairings,
	)(text)
}
