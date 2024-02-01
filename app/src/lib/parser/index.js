import {pipe} from '$lib/pipeline'
import {tokenize_input} from './tokenize'
import {check_syntax} from './syntax'
import {use_alternate_lookups} from './alternate_lookups'
import {transform_tokens} from './token_transforms'

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function parse(text) {
	// prettier-ignore
	return pipe(
		tokenize_input,
		check_syntax,
		use_alternate_lookups,
		transform_tokens,
	)(text)
}
