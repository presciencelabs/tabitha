import {pipe} from '$lib/pipeline'
import {check_syntax} from './syntax'
import {tokenize_input} from './tokenize'

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function parse(text) {
	// prettier-ignore
	return pipe(
		tokenize_input,
		check_syntax,
	)(text)
}
