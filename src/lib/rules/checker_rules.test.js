import { TOKEN_TYPE, create_clause_token, create_lookup_result, create_token, flatten_sentence } from '../token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { CHECKER_RULES } from './checker_rules'
import { expect_error, expect_message_to_match, expect_no_message } from '$lib/test_helps'

/**
 * 
 * @param {Token} left
 * @param {Token} right
 * @param {PairingType} pairing_type
 * @returns {Token}
 */
function create_pairing_token(left, right, pairing_type='complex') {
	left.pairing = right
	left.pairing_type = pairing_type
	return left
}

/**
 * 
 * @param {string} token
 * @param {Object} [data={}]
 * @param {LookupResult[]} [data.lookup_results=[]]
 * @param {Tag} [data.tag={}]
 * @returns {Token}
 */
function create_lookup_token(token, { lookup_results=[], tag={} }={}) {
	return create_token(token, TOKEN_TYPE.LOOKUP_WORD, { tag, lookup_term: token, lookup_results })
}

/**
 * 
 * @param {Token[]} tokens
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens, { 'clause_type': 'main_clause' }) }
}

/**
 * 
 * @param {string} stem
 * @param {Object} [data={}]
 * @param {string} [data.sense='A']
 * @param {string} [data.part_of_speech='Noun']
 * @param {number} [data.level=1]
 * @param {number} [data.ontology_id=1]
 * @returns {LookupResult}
 */
function lookup_result(stem, { sense='A', part_of_speech='Noun', level=1, ontology_id=1 }={}) {
	return create_lookup_result({ stem, part_of_speech }, { sense, level, ontology_id })
}

describe('built-in checker rules', () => {
	describe('sentence capitalization', () => {
		const CAPITALIZATION_RULE = CHECKER_RULES.slice(0, 1)

		test('valid', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('Token', { tag: { 'position': 'first_word' } }),
				create_pairing_token(
					create_lookup_token('First', { tag: { 'position': 'first_word' } }),
					create_lookup_token('second'),
				),
				create_token('Function', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'position': 'first_word' } }),
				create_token('name', TOKEN_TYPE.LOOKUP_WORD, { tag: { 'position': 'first_word' }, pronoun: create_token('You', TOKEN_TYPE.FUNCTION_WORD) }),
			])]

			const checked_tokens = apply_rules(test_tokens, CAPITALIZATION_RULE)

			expect(checked_tokens).toEqual(test_tokens)
		})

		test('invalid', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token', { tag: { 'position': 'first_word' } }),
				create_pairing_token(
					create_lookup_token('first', { tag: { 'position': 'first_word' } }),
					create_lookup_token('second'),
				),
				create_token('function', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'position': 'first_word' } }),
				create_token('name', TOKEN_TYPE.LOOKUP_WORD, { tag: { 'position': 'first_word' }, pronoun: create_token('you', TOKEN_TYPE.FUNCTION_WORD) }),
			])]

			const checked_tokens = apply_rules(test_tokens, CAPITALIZATION_RULE).flatMap(flatten_sentence)

			expect_error(checked_tokens[0], ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect_error(checked_tokens[1], ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect_error(checked_tokens[2], ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect_error(checked_tokens[3].pronoun, ERRORS.FIRST_WORD_NOT_CAPITALIZED)
		})
	})

	describe('complexity level check', () => {
		const LEVEL_CHECK_RULES = CHECKER_RULES.slice(4, 6)

		test('different levels', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token0', { lookup_results: [lookup_result('token0', { level: 0 })] }),
				create_lookup_token('token1', { lookup_results: [lookup_result('token1', { level: 1 })] }),
				create_lookup_token('token2', { lookup_results: [lookup_result('token2', { level: 2 })] }),
				create_lookup_token('token3', { lookup_results: [lookup_result('token3', { level: 3 })] }),
				create_lookup_token('token4', { lookup_results: [lookup_result('token4', { level: 4 })] }),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect_no_message(checked_tokens[0])
			expect_no_message(checked_tokens[1])
			expect_error(checked_tokens[2], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_error(checked_tokens[3], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_no_message(checked_tokens[4])
		})
		test('pairing: both words right level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 0 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
					'complex',
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 3 })] }),
					'complex',
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 1 })] }),
					'literal',
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES)
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: level 4 words are valid for both', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 4 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 4 })] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES)
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: first word wrong level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 2 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 3 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 3 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 3 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 1 })] }),
					'literal',
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect_error(checked_tokens[0], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_no_message(checked_tokens[0].pairing)
			expect_error(checked_tokens[1], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_no_message(checked_tokens[1].pairing)
			expect_error(checked_tokens[2], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_no_message(checked_tokens[2].pairing)
		})
		test('pairing: second word wrong level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 0 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 0 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 1 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
					'literal',
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect_no_message(checked_tokens[0])
			expect_error(checked_tokens[0].pairing, ERRORS.WORD_LEVEL_TOO_LOW)
			expect_no_message(checked_tokens[1])
			expect_error(checked_tokens[1].pairing, ERRORS.WORD_LEVEL_TOO_LOW)
			expect_no_message(checked_tokens[2])
			expect_error(checked_tokens[2].pairing, ERRORS.WORD_LEVEL_TOO_HIGH)
		})
		test('pairing: both words wrong level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 2 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 0 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 3 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 1 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 3 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
					'literal',
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect_error(checked_tokens[0], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_error(checked_tokens[0].pairing, ERRORS.WORD_LEVEL_TOO_LOW)
			expect_error(checked_tokens[1], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_error(checked_tokens[1].pairing, ERRORS.WORD_LEVEL_TOO_LOW)
			expect_error(checked_tokens[2], ERRORS.WORD_LEVEL_TOO_HIGH)
			expect_error(checked_tokens[2].pairing, ERRORS.WORD_LEVEL_TOO_HIGH)
		})
	})
	
	describe('ambiguous level check', () => {
		const AMBIGUOUS_LEVEL_CHECK = CHECKER_RULES.slice(6, 7)

		test('main token level check', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token', { lookup_results: [] }),
				create_lookup_token('token', { lookup_results: [
					lookup_result('token', { level: 1, ontology_id: 1 }),
					lookup_result('token2', { level: 2, ontology_id: 2 }),
				] }),
				create_lookup_token('token', { lookup_results: [
					lookup_result('token', { level: 1, ontology_id: 3 }),
					lookup_result('token4', { level: 4, ontology_id: 4 }),
				] }),
				create_lookup_token('token', { lookup_results: [
					lookup_result('token', { level: 2, ontology_id: 5 }),
					lookup_result('token1', { level: 1, ontology_id: 6 }),
				] }),
			])]

			const checked_tokens = apply_rules(test_tokens, AMBIGUOUS_LEVEL_CHECK).flatMap(flatten_sentence)

			expect_no_message(checked_tokens[0])
			expect_no_message(checked_tokens[1])
			expect_no_message(checked_tokens[2])
			expect_message_to_match(checked_tokens[3], 'warning', /^This word has multiple senses/)
		})
		test('complex pairing level check', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [
						lookup_result('second', { level: 2 }),
						lookup_result('second1', { level: 1 }),
					] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [
						lookup_result('second', { level: 2 }),
						lookup_result('second1', { level: 4 }),
					] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [
						lookup_result('second', { level: 1 }),
						lookup_result('second2', { level: 2 }),
					] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, AMBIGUOUS_LEVEL_CHECK).flatMap(flatten_sentence)
	
			expect_no_message(checked_tokens[0])
			expect_no_message(checked_tokens[1])
			expect_no_message(checked_tokens[2])
			expect_message_to_match(checked_tokens[3].pairing, 'warning', /^This word has multiple senses/)
		})
	})
	
	describe('no lookup check', () => {
		const NO_LOOKUP_CHECK = CHECKER_RULES.slice(7, 8)

		test('no results, lookup error', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token'),
				create_pairing_token(
					create_lookup_token('first'),
					create_lookup_token('second'),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, NO_LOOKUP_CHECK).flatMap(flatten_sentence)

			expect_message_to_match(checked_tokens[0], 'warning', /^'token' is not recognized/)
			expect_message_to_match(checked_tokens[1], 'warning', /^'first' is not recognized/)
			expect_message_to_match(checked_tokens[1].pairing, 'warning', /^'second' is not recognized/)
		})
	})
})