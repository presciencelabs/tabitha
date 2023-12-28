import {pipe} from '$lib/pipeline'
import {check_balancing} from './balancing'
import {check_syntax} from './syntax'
import {tokenize_input, tokenize_punctuation} from './tokenize'

/**
 * @param {string} text
 * @returns {CheckedToken[]}
 */
export function parse(text) {
	// prettier-ignore
	return pipe(
		tokenize_input,
		check_syntax,
		check_balancing,
		tokenize_punctuation,
	)(text)
}
