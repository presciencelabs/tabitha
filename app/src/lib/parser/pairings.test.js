import {describe, expect, test} from 'vitest'
import {TOKEN_TYPE, create_token} from './token'
import {check_pairings} from './pairings'
import {ERRORS} from './error_messages'

/**
 * 
 * @param {Token} left 
 * @param {Token} right 
 * @returns {Token}
 */
function create_pairing_token(left, right) {
	const token = `${left.token}/${right.token}`
	return create_token(token, TOKEN_TYPE.PAIRING, { sub_tokens: [left, right] })
}

/**
 * 
 * @param {string} token 
 * @param {Object} [data={}] 
 * @param {OntologyResult[]} [data.lookup_results=[]] 
 * @returns {Token}
 */
function create_lookup_token(token, {lookup_results=[]}={}) {
	const lookup_token = create_token(token, TOKEN_TYPE.LOOKUP_WORD, {lookup_term: token})
	lookup_token.lookup_results = lookup_results
	return lookup_token
}

/**
 * 
 * @param {string} stem
 * @param {Object} [data={}] 
 * @param {string} [data.sense='A'] 
 * @param {string} [data.part_of_speech='Noun'] 
 * @param {number} [data.level=1] 
 * @returns {OntologyResult}
 */
function create_lookup_result(stem, {sense='A', part_of_speech='Noun', level=1}={}) {
	return {
		id: '0',
		stem: stem,
		sense,
		part_of_speech,
		level,
		gloss: '',
	}
}

describe('pairing level check', () => {
	test('both words right level', () => {
		const test_tokens = [
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 0})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 2})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 3})]}),
			),
		]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('first word wrong level', () => {
		const test_tokens = [
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 2})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 2})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 3})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 3})]}),
			),
		]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens[0].sub_tokens[0].message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[0].sub_tokens[1].message).toBe('')
		expect(checked_tokens[1].sub_tokens[0].message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[1].sub_tokens[1].message).toBe('')
	})
	test('second word wrong level', () => {
		const test_tokens = [
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 0})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 0})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 1})]}),
			),
		]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens[0].sub_tokens[0].message).toBe('')
		expect(checked_tokens[0].sub_tokens[1].message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		expect(checked_tokens[1].sub_tokens[0].message).toBe('')
		expect(checked_tokens[1].sub_tokens[1].message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
	})
	test('both words wrong level', () => {
		const test_tokens = [
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 2})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 0})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 3})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 1})]}),
			),
		]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens[0].sub_tokens[0].message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[0].sub_tokens[1].message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		expect(checked_tokens[1].sub_tokens[0].message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[1].sub_tokens[1].message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
	})
})