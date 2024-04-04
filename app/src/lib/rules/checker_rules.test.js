import { TOKEN_TYPE, create_clause_token, create_lookup_result, create_token, flatten_sentence } from '../parser/token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { CHECKER_RULES } from './checker_rules'

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
 * @param {LookupResult[]} [data.lookup_results=[]] 
 * @param {Tag} [data.tag={}] 
 * @returns {Token}
 */
function create_lookup_token(token, { lookup_results=[], tag={} }={}) {
	const lookup_token = create_token(token, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: token, tag })
	lookup_token.lookup_results = lookup_results
	return lookup_token
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
 * @returns {LookupResult}
 */
function lookup_w_concept(stem, { sense='A', part_of_speech='Noun', level=1 }={}) {
	const concept = {
		id: '0',
		stem,
		sense,
		part_of_speech,
		level,
		gloss: '',
		categorization: '',
	}
	return create_lookup_result({ stem, part_of_speech }, { concept })
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

			expect(checked_tokens[0].error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(checked_tokens[1].error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(checked_tokens[2].error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(checked_tokens[3].pronoun?.error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
		})
	})

	describe('complexity level check', () => {
		const LEVEL_CHECK_RULES = CHECKER_RULES.slice(1, 4)

		test('different levels', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token0', { lookup_results: [lookup_w_concept('token0', { level: 0 })] }),
				create_lookup_token('token1', { lookup_results: [lookup_w_concept('token1', { level: 1 })] }),
				create_lookup_token('token2', { lookup_results: [lookup_w_concept('token2', { level: 2 })] }),
				create_lookup_token('token3', { lookup_results: [lookup_w_concept('token3', { level: 3 })] }),
				create_lookup_token('token4', { lookup_results: [lookup_w_concept('token4', { level: 4 })] }),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe('')
			expect(checked_tokens[1].error_message).toBe('')
			expect(checked_tokens[2].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			// expect(checked_tokens[3].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)	// TODO renable when the rule is fixed
			expect(checked_tokens[4].error_message).toBe('')
		})
		test('pairing: both words right level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 0 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 2 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 3 })] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES)
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: level 4 words are valid for both', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 4 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 4 })] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES)
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: first word wrong level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 2 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 2 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 3 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 3 })] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[0].complex_pairing?.error_message).toBe('')
			expect(checked_tokens[1].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[1].complex_pairing?.error_message).toBe('')
		})
		test('pairing: second word wrong level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 0 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 0 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 1 })] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe('')
			expect(checked_tokens[0].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
			expect(checked_tokens[1].error_message).toBe('')
			expect(checked_tokens[1].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		})
		test('pairing: both words wrong level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 2 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 0 })] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 3 })] }),
					create_lookup_token('second', { lookup_results: [lookup_w_concept('second', { level: 1 })] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, LEVEL_CHECK_RULES).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[0].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
			expect(checked_tokens[1].error_message).toBe(ERRORS.WORD_LEVEL_TOO_HIGH)
			expect(checked_tokens[1].complex_pairing?.error_message).toBe(ERRORS.WORD_LEVEL_TOO_LOW)
		})
	})
	
	describe('ambiguous level check', () => {
		const AMBIGUOUS_LEVEL_CHECK = CHECKER_RULES.slice(4, 5)

		test('main token level check', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token', { lookup_results: [] }),
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token', { level: 1 }),
					lookup_w_concept('token2', { level: 2 }),
				] }),
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token', { level: 1 }),
					lookup_w_concept('token4', { level: 4 }),
				] }),
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token', { level: 2 }),
					lookup_w_concept('token1', { level: 1 }),
				] }),
			])]
	
			const checked_tokens = apply_rules(test_tokens, AMBIGUOUS_LEVEL_CHECK).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].suggest_message).toBe('')
			expect(checked_tokens[1].suggest_message).toBe('')
			expect(checked_tokens[2].suggest_message).toBe('')
			expect(checked_tokens[3].suggest_message).toMatch(/^This word has multiple senses/)
		})
		test('complex pairing level check', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [
						lookup_w_concept('second', { level: 2 }),
						lookup_w_concept('second1', { level: 1 }),
					] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [
						lookup_w_concept('second', { level: 2 }),
						lookup_w_concept('second1', { level: 4 }),
					] }),
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_w_concept('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [
						lookup_w_concept('second', { level: 1 }),
						lookup_w_concept('second2', { level: 2 }),
					] }),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, AMBIGUOUS_LEVEL_CHECK).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].complex_pairing?.suggest_message).toBe('')
			expect(checked_tokens[1].complex_pairing?.suggest_message).toBe('')
			expect(checked_tokens[2].complex_pairing?.suggest_message).toBe('')
			expect(checked_tokens[3].complex_pairing?.suggest_message).toMatch(/^This word has multiple senses/)
		})
	})
	
	describe('no lookup check', () => {
		const NO_LOOKUP_CHECK = CHECKER_RULES.slice(5, 6)

		test('no results, lookup error', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token'),
				create_pairing_token(
					create_lookup_token('first'),
					create_lookup_token('second'),
				),
			])]
	
			const checked_tokens = apply_rules(test_tokens, NO_LOOKUP_CHECK).flatMap(flatten_sentence)
	
			expect(checked_tokens[0].suggest_message).toMatch(/^'token' is not in the Ontology/)
			expect(checked_tokens[1].suggest_message).toMatch(/^'first' is not in the Ontology/)
			expect(checked_tokens[1].complex_pairing?.suggest_message).toMatch(/^'second' is not in the Ontology/)
		})
	})
})