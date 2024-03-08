import {TOKEN_TYPE, create_clause_token, create_token, flatten_sentence} from '../parser/token'
import {ERRORS} from '../parser/error_messages'
import {apply_rules} from './rules_processor'
import {describe, expect, test} from 'vitest'
import {CHECKER_RULES} from './checker_rules'

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
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	const clause = create_clause_token(tokens)
	clause.tag = 'main_clause'
	return { clause }
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
		categorization: '',
	}
}

describe('built-in checker rules', () => {
	describe('complexity level check', () => {
		test('different levels', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token0', {lookup_results: [create_lookup_result('token0', {level: 0})]}),
				create_lookup_token('token1', {lookup_results: [create_lookup_result('token1', {level: 1})]}),
				create_lookup_token('token2', {lookup_results: [create_lookup_result('token2', {level: 2})]}),
				create_lookup_token('token3', {lookup_results: [create_lookup_result('token3', {level: 3})]}),
				create_lookup_token('token4', {lookup_results: [create_lookup_result('token4', {level: 4})]}),
			])]
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe('')
			expect(checked_tokens[1].error_message).toBe('')
			expect(checked_tokens[2].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[3].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[4].error_message).toBe('')
		})
		test('pairing: both words right level', () => {
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
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES)
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: level 4 words are valid for both', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 4})]}),
					create_lookup_token('second', {lookup_results: [create_lookup_result('second', {level: 4})]}),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES)
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: first word wrong level', () => {
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
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[0].complex_pairing?.error_message).toBe('')
			expect(checked_tokens[1].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[1].complex_pairing?.error_message).toBe('')
		})
		test('pairing: second word wrong level', () => {
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
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe('')
			expect(checked_tokens[0].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
			expect(checked_tokens[1].error_message).toBe('')
			expect(checked_tokens[1].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		})
		test('pairing: both words wrong level', () => {
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
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[0].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
			expect(checked_tokens[1].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[1].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		})
		test('no results no error', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token'),
				create_pairing_token(
					create_lookup_token('first'),
					create_lookup_token('second'),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe('')
			expect(checked_tokens[1].error_message).toBe('')
			expect(checked_tokens[1].complex_pairing?.error_message).toBe('')
		})
	})
	
	describe('ambiguous level check', () => {
		test('main token level check', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token', {lookup_results: []}),
				create_lookup_token('token', {lookup_results: [
					create_lookup_result('token', {level: 1}),
					create_lookup_result('token2', {level: 2}),
				]}),
				create_lookup_token('token', {lookup_results: [
					create_lookup_result('token', {level: 1}),
					create_lookup_result('token4', {level: 4}),
				]}),
				create_lookup_token('token', {lookup_results: [
					create_lookup_result('token', {level: 2}),
					create_lookup_result('token1', {level: 1}),
				]}),
			])]
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].suggest_message).toBe('')
			expect(checked_tokens[1].suggest_message).toBe('')
			expect(checked_tokens[2].suggest_message).toBe('')
			expect(checked_tokens[3].suggest_message).toBe(ERRORS.AMBIGUOUS_LEVEL)
		})
		test('complex pairing level check', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
					create_lookup_token('second', {lookup_results: []}),
				),
				create_pairing_token(
					create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
					create_lookup_token('second', {lookup_results: [
						create_lookup_result('second', {level: 2}),
						create_lookup_result('second1', {level: 1}),
					]}),
				),
				create_pairing_token(
					create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
					create_lookup_token('second', {lookup_results: [
						create_lookup_result('second', {level: 2}),
						create_lookup_result('second1', {level: 4}),
					]}),
				),
				create_pairing_token(
					create_lookup_token('first', {lookup_results: [create_lookup_result('first', {level: 1})]}),
					create_lookup_token('second', {lookup_results: [
						create_lookup_result('second', {level: 1}),
						create_lookup_result('second2', {level: 2}),
					]}),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, CHECKER_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].complex_pairing?.suggest_message).toBe('')
			expect(checked_tokens[1].complex_pairing?.suggest_message).toBe('')
			expect(checked_tokens[2].complex_pairing?.suggest_message).toBe('')
			expect(checked_tokens[3].complex_pairing?.suggest_message).toBe(ERRORS.AMBIGUOUS_LEVEL)
		})
	})
})