import {describe, expect, test} from 'vitest'
import {TOKEN_TYPE, create_clause_token, create_token, flatten_sentence} from './token'
import {check_pairings} from './pairings'
import {ERRORS} from './error_messages'

/**
 * 
 * @param {Token} left 
 * @param {Token} right 
 * @returns {Token}
 */
function create_pairing_token(left, right) {
	left.complex_pairing = right
	return left
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

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens) }
}

describe('pairing level check', () => {
	test('both words right level', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 0})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 2})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 3})]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('first word wrong level', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 2})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 2})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 3})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 3})]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens).flatMap(flatten_sentence)

		expect(checked_tokens[0].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[0].complex_pairing?.error_message).toBe('')
		expect(checked_tokens[1].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[1].complex_pairing?.error_message).toBe('')
	})
	test('second word wrong level', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 0})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 0})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 1})]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens).flatMap(flatten_sentence)

		expect(checked_tokens[0].error_message).toBe('')
		expect(checked_tokens[0].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		expect(checked_tokens[1].error_message).toBe('')
		expect(checked_tokens[1].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
	})
	test('both words wrong level', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 2})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 0})]}),
			),
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 3})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 1})]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens).flatMap(flatten_sentence)

		expect(checked_tokens[0].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[0].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		expect(checked_tokens[1].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
		expect(checked_tokens[1].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
	})
	test('lookups with multiple levels does not cause error', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
				create_lookup_token('second', {lookup_results: [
					create_lookup_result('second', {sense: 'A', level: 0}),
					create_lookup_result('second', {sense: 'B', level: 2}),
				]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens).toEqual(test_tokens)
	})
})

describe('part_of_speech disambiguation', () => {
	test('both words fully match part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
				create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 2})]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with one part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [
					create_lookup_result('first', {part_of_speech: 'Noun', level: 1}),
					create_lookup_result('first', {part_of_speech: 'Verb', level: 1}),
				]}),
				create_lookup_token('second', {lookup_results: [
					create_lookup_result('second', {part_of_speech: 'Verb', level: 2}),
					create_lookup_result('second', {part_of_speech: 'Adjective', level: 2}),
				]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens).flatMap(flatten_sentence)

		expect(checked_tokens[0].error_message).toBe('')
		expect(checked_tokens[0].lookup_results.length).toBe(1)
		expect(checked_tokens[0].lookup_results[0].part_of_speech).toBe('Verb')

		expect(checked_tokens[0].complex_pairing?.error_message).toBe('')
		expect(checked_tokens[0].complex_pairing?.lookup_results.length).toBe(1)
		expect(checked_tokens[0].complex_pairing?.lookup_results[0].part_of_speech).toBe('Verb')
	})
	test('overlap with two part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [
					create_lookup_result('first', {part_of_speech: 'Noun', level: 1}),
					create_lookup_result('first', {part_of_speech: 'Verb', level: 1}),
				]}),
				create_lookup_token('second', {lookup_results: [
					create_lookup_result('second', {part_of_speech: 'Verb', level: 2}),
					create_lookup_result('second', {part_of_speech: 'Noun', level: 2}),
				]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens)

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with no part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_pairing_token(
				create_lookup_token('first', {lookup_results: [
					create_lookup_result('first', {part_of_speech: 'Noun', level: 1}),
					create_lookup_result('first', {part_of_speech: 'Verb', level: 1}),
				]}),
				create_lookup_token('second', {lookup_results: [
					create_lookup_result('second', {part_of_speech: 'Adjective', level: 2}),
					create_lookup_result('second', {part_of_speech: 'Adverb', level: 2}),
				]}),
			),
		])]

		const checked_tokens = check_pairings(test_tokens).flatMap(flatten_sentence)

		expect(checked_tokens[0].error_message).toMatch(/^Cannot pair words/)
		expect(checked_tokens[0].lookup_results.length).toBe(2)

		expect(checked_tokens[0].complex_pairing?.error_message).toBe('')
		expect(checked_tokens[0].complex_pairing?.lookup_results.length).toBe(2)
	})
})