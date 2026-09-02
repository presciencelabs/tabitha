import { TOKEN_TYPE, create_clause_token, create_lookup_result, create_token, flatten_sentence } from '../token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { CHECKER_RULES } from './checker_rules'
import { expect_error, expect_message_to_match, expect_no_message } from '$lib/test_helps'
import type { OntologyStatus, PairingType, Tag } from '@tabitha/types'
import type { Sentence, Token, LookupResult } from '$lib/types'

function create_pairing_token(left: Token, right: Token, pairing_type: PairingType = 'simple-complex'): Token {
	left.pairing = right
	left.pairing_type = pairing_type
	return left
}

function create_lookup_token(token: string, { lookup_results = [], tag = {} }: { lookup_results?: LookupResult[]; tag?: Tag } = {}): Token {
	return create_token({ token, type: TOKEN_TYPE.LOOKUP_WORD, tag, lookup_term: token, lookup_results })
}

function create_sentence(tokens: Token[]): Sentence {
	return { clause: create_clause_token({ sub_tokens: tokens, tag: { 'clause_type': 'main_clause' } }) }
}

function lookup_result(stem: string, { sense = 'A', part_of_speech = 'Noun', level = 1, ontology_status = 'in ontology' as OntologyStatus }: { sense?: string; part_of_speech?: string; level?: number; ontology_status?: OntologyStatus } = {}): LookupResult {
	return create_lookup_result({ stem, part_of_speech, sense, level, ontology_status })
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
				create_token({ token: 'Function', type: TOKEN_TYPE.FUNCTION_WORD, tag: { 'position': 'first_word' } }),
				create_token({ token: 'name', type: TOKEN_TYPE.LOOKUP_WORD, tag: { 'position': 'first_word' }, pronoun: create_token({ token: 'You', type: TOKEN_TYPE.FUNCTION_WORD }) }),
			])]

			const checked_tokens = apply_rules({ sentences: test_tokens, rules: CAPITALIZATION_RULE })

			expect(checked_tokens).toEqual(test_tokens)
		})

		test('invalid', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token', { tag: { 'position': 'first_word' } }),
				create_pairing_token(
					create_lookup_token('first', { tag: { 'position': 'first_word' } }),
					create_lookup_token('second'),
				),
				create_token({ token: 'function', type: TOKEN_TYPE.FUNCTION_WORD, tag: { 'position': 'first_word' } }),
				create_token({ token: 'name', type: TOKEN_TYPE.LOOKUP_WORD, tag: { 'position': 'first_word' }, pronoun: create_token({ token: 'you', type: TOKEN_TYPE.FUNCTION_WORD }) }),
			])]

			const checked_tokens = apply_rules({ sentences: test_tokens, rules: CAPITALIZATION_RULE }).flatMap(flatten_sentence)

			expect_error({ token: checked_tokens[0], message: ERRORS.FIRST_WORD_NOT_CAPITALIZED })
			expect_error({ token: checked_tokens[1], message: ERRORS.FIRST_WORD_NOT_CAPITALIZED })
			expect_error({ token: checked_tokens[2], message: ERRORS.FIRST_WORD_NOT_CAPITALIZED })
			expect_error({ token: checked_tokens[3].pronoun, message: ERRORS.FIRST_WORD_NOT_CAPITALIZED })
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
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: LEVEL_CHECK_RULES }).flatMap(flatten_sentence)
	
			expect_no_message(checked_tokens[0])
			expect_no_message(checked_tokens[1])
			expect_error({ token: checked_tokens[2], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_error({ token: checked_tokens[3], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_no_message(checked_tokens[4])
		})
		test('pairing: both words right level', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 0 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
					'simple-complex',
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 3 })] }),
					'simple-complex',
				),
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 1 })] }),
					'dynamic-literal',
				),
			])]
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: LEVEL_CHECK_RULES })
	
			expect(checked_tokens).toEqual(test_tokens)
		})
		test('pairing: level 4 words are valid for both', () => {
			const test_tokens = [create_sentence([
				create_pairing_token(
					create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 4 })] }),
					create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 4 })] }),
				),
			])]
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: LEVEL_CHECK_RULES })
	
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
					'dynamic-literal',
				),
			])]
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: LEVEL_CHECK_RULES }).flatMap(flatten_sentence)
	
			expect_error({ token: checked_tokens[0], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_no_message(checked_tokens[0].pairing)
			expect_error({ token: checked_tokens[1], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_no_message(checked_tokens[1].pairing)
			expect_error({ token: checked_tokens[2], message: ERRORS.WORD_LEVEL_TOO_HIGH })
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
					'dynamic-literal',
				),
			])]
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: LEVEL_CHECK_RULES }).flatMap(flatten_sentence)
	
			expect_no_message(checked_tokens[0])
			expect_error({ token: checked_tokens[0].pairing, message: ERRORS.WORD_LEVEL_TOO_LOW })
			expect_no_message(checked_tokens[1])
			expect_error({ token: checked_tokens[1].pairing, message: ERRORS.WORD_LEVEL_TOO_LOW })
			expect_no_message(checked_tokens[2])
			expect_error({ token: checked_tokens[2].pairing, message: ERRORS.WORD_LEVEL_TOO_HIGH })
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
					'dynamic-literal',
				),
			])]
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: LEVEL_CHECK_RULES }).flatMap(flatten_sentence)
	
			expect_error({ token: checked_tokens[0], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_error({ token: checked_tokens[0].pairing, message: ERRORS.WORD_LEVEL_TOO_LOW })
			expect_error({ token: checked_tokens[1], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_error({ token: checked_tokens[1].pairing, message: ERRORS.WORD_LEVEL_TOO_LOW })
			expect_error({ token: checked_tokens[2], message: ERRORS.WORD_LEVEL_TOO_HIGH })
			expect_error({ token: checked_tokens[2].pairing, message: ERRORS.WORD_LEVEL_TOO_HIGH })
		})
	})
	
	describe('ambiguous level check', () => {
		const AMBIGUOUS_LEVEL_CHECK = CHECKER_RULES.slice(6, 7)

		test('main token level check', () => {
			const test_tokens = [create_sentence([
				create_lookup_token('token', { lookup_results: [] }),
				create_lookup_token('token', { lookup_results: [
					lookup_result('token', { level: 1 }),
					lookup_result('token2', { level: 2 }),
				] }),
				create_lookup_token('token', { lookup_results: [
					lookup_result('token', { level: 1 }),
					lookup_result('token4', { level: 4 }),
				] }),
				create_lookup_token('token', { lookup_results: [
					lookup_result('token', { level: 2 }),
					lookup_result('token1', { level: 1 }),
				] }),
			])]

			const checked_tokens = apply_rules({ sentences: test_tokens, rules: AMBIGUOUS_LEVEL_CHECK }).flatMap(flatten_sentence)

			expect_no_message(checked_tokens[0])
			expect_no_message(checked_tokens[1])
			expect_no_message(checked_tokens[2])
			expect_message_to_match({ token: checked_tokens[3], message_type: 'warning', regex: /^This word has multiple senses/ })
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
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: AMBIGUOUS_LEVEL_CHECK }).flatMap(flatten_sentence)
	
			expect_no_message(checked_tokens[0])
			expect_no_message(checked_tokens[1])
			expect_no_message(checked_tokens[2])
			expect_message_to_match({ token: checked_tokens[3].pairing, message_type: 'warning', regex: /^This word has multiple senses/ })
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
	
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: NO_LOOKUP_CHECK }).flatMap(flatten_sentence)

			expect_message_to_match({ token: checked_tokens[0], message_type: 'warning', regex: /^'token' is not recognized/ })
			expect_message_to_match({ token: checked_tokens[1], message_type: 'warning', regex: /^'first' is not recognized/ })
			expect_message_to_match({ token: checked_tokens[1].pairing, message_type: 'warning', regex: /^'second' is not recognized/ })
		})
	})

	describe('temporal phrase comma suggestion', () => {
		test('suggests comma after temporal phrase One morning that man', () => {
			const test_tokens = [create_sentence([
				create_token({ token: 'One', type: TOKEN_TYPE.FUNCTION_WORD }),
				create_lookup_token('morning', { lookup_results: [lookup_result('morning')] }),
				create_token({ token: 'that', type: TOKEN_TYPE.FUNCTION_WORD }),
				create_lookup_token('man', { lookup_results: [lookup_result('man', { part_of_speech: 'Noun' })] }),
				create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			])]
			const ONE_DAY_RULE = CHECKER_RULES.filter(r => r.name.includes('Suggest a comma after'))
			const checked_tokens = apply_rules({ sentences: test_tokens, rules: ONE_DAY_RULE }).flatMap(flatten_sentence)
			const comma_token = checked_tokens.find(t => t.token === ',')
			expect(comma_token?.messages.some(m => m.message.includes("Add a comma after 'One morning'"))).toBe(true)
		})
	})
})