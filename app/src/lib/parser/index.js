import {pipe} from '$lib/pipeline'
import {tokenize_input} from './tokenize'
import {check_syntax} from './syntax'
import {use_alternate_lookups} from './alternate_lookups'
import {apply_transform_rules, apply_checker_rules} from '../rules/rules_processor'

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function parse(text) {
	return pipe(
		tokenize_input,
		check_syntax,
		use_alternate_lookups,
		apply_transform_rules,
		apply_checker_rules,
	)(text)
}
