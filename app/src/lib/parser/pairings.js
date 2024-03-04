import {REGEXES} from '$lib/regexes'
import {flatten_sentences} from './clausify'
import {ERRORS} from './error_messages'
import {check_token_lookup} from './token'

/**
 *
 * @param {Sentence[]} sentences
 * @returns {Sentence[]}
 */
export function check_pairings(sentences) {
	flatten_sentences(sentences).forEach(check_pairing)

	return sentences

	/**
	 *
	 * @param {Token} token
	 */
	function check_pairing(token) {
		if (!token.complex_pairing) {
			return
		}

		const [left, right] = [token, token.complex_pairing]

		check_overlapping_categories(left, right)
		check_levels(left, right)
	}

	/**
	 * 
	 * @param {Token} left 
	 * @param {Token} right 
	 */
	function check_overlapping_categories(left, right) {
		if (left.lookup_results.length === 0 && right.lookup_results.length === 0) {
			return
		}

		// filter lookup results based on the overlap of the two concepts
		const left_categories = new Set(left.lookup_results.map(result => result.part_of_speech))
		const right_categories = new Set(right.lookup_results.map(result => result.part_of_speech))
		const overlapping_categories = new Set([...left_categories].filter(x => right_categories.has(x)))

		if (overlapping_categories.size > 0) {
			left.form_results = left.form_results.filter(result => overlapping_categories.has(result.part_of_speech))
			left.lookup_results = left.lookup_results.filter(result => overlapping_categories.has(result.part_of_speech))

			right.form_results = right.form_results.filter(result => overlapping_categories.has(result.part_of_speech))
			right.lookup_results = right.lookup_results.filter(result => overlapping_categories.has(result.part_of_speech))
		} else {
			left.message = 'Cannot pair words of different parts of speech'
		}
	}

	/**
	 * 
	 * @param {Token} left 
	 * @param {Token} right 
	 */
	function check_levels(left, right) {
		// Check if the levels are correct
		// TODO remove the left check when we address Issue #30 (https://github.com/presciencelabs/tabitha-editor/issues/30)
		if (check_token_lookup(concept => REGEXES.IS_LEVEL_COMPLEX.test(`${concept.level}`))(left)) {
			left.message = ERRORS.WORD_LEVEL_TOO_HIGH
		}
		if (check_token_lookup(concept => REGEXES.IS_LEVEL_SIMPLE.test(`${concept.level}`))(right)) {
			right.message = ERRORS.WORD_LEVEL_TOO_LOW
		}
	}
}