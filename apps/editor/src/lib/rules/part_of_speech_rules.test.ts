import { TOKEN_TYPE, create_clause_token, create_lookup_result, create_token, flatten_sentence } from '../token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { PART_OF_SPEECH_RULES } from './part_of_speech_rules'
import { expect_error } from '$lib/test_helps'
import type { OntologyStatus, PairingType, Tag } from '@tabitha/types'
import type { Sentence, Token, LookupResult } from '$lib/types'

function create_pairing_token(left: Token, right: Token, pairing_type: PairingType = 'complex'): Token {
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

function lookup_result(stem: string, { sense = 'A', part_of_speech = 'Noun', level = 1, ontology_status = 'in ontology' }: { sense?: string; part_of_speech?: string; level?: number; ontology_status?: OntologyStatus } = {}): LookupResult {
	return create_lookup_result({ stem, part_of_speech, sense, level, ontology_status })
}

describe('pairing part_of_speech disambiguation', () => {
	test('both words fully match part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
				create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
			),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES })

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with one part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [
					lookup_result('first', { part_of_speech: 'Noun', level: 1 }),
					lookup_result('first', { part_of_speech: 'Verb', level: 1 }),
				] }),
				create_lookup_token('second', { lookup_results: [
					lookup_result('second', { part_of_speech: 'Verb', level: 2 }),
					lookup_result('second', { part_of_speech: 'Adjective', level: 2 }),
				] }),
			),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES }).flatMap(flatten_sentence)

		expect(checked_tokens[1].messages.length).toBe(0)
		expect(checked_tokens[1].lookup_results.length).toBe(1)
		expect(checked_tokens[1].lookup_results[0].part_of_speech).toBe('Verb')

		expect(checked_tokens[1].pairing?.messages.length).toBe(0)
		expect(checked_tokens[1].pairing?.lookup_results.length).toBe(1)
		expect(checked_tokens[1].pairing?.lookup_results[0].part_of_speech).toBe('Verb')
	})
	test('overlap with two part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [
					lookup_result('first', { part_of_speech: 'Noun', level: 1 }),
					lookup_result('first', { part_of_speech: 'Verb', level: 1 }),
				] }),
				create_lookup_token('second', { lookup_results: [
					lookup_result('second', { part_of_speech: 'Verb', level: 2 }),
					lookup_result('second', { part_of_speech: 'Noun', level: 2 }),
				] }),
			),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES })

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with no part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [
					lookup_result('first', { part_of_speech: 'Noun', level: 1 }),
					lookup_result('first', { part_of_speech: 'Adverb', level: 1 }),
				] }),
				create_lookup_token('second', { lookup_results: [
					lookup_result('second', { part_of_speech: 'Adjective', level: 2 }),
					lookup_result('second', { part_of_speech: 'Adposition', level: 2 }),
				] }),
			),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES }).flatMap(flatten_sentence)

		expect_error({ token: checked_tokens[1], message: ERRORS.PAIRING_DIFFERENT_PARTS_OF_SPEECH })
		expect(checked_tokens[1].lookup_results.length).toBe(2)

		expect(checked_tokens[1].pairing?.messages.length).toBe(0)
		expect(checked_tokens[1].pairing?.lookup_results.length).toBe(2)
	})
})

describe('possessive and pronoun POS rules', () => {
	test('possessive noun rule selects noun part of speech', () => {
		const test_tokens = [create_sentence([
			create_lookup_token("king's", {
				tag: { relation: 'genitive_saxon' },
				lookup_results: [
					lookup_result('king', { part_of_speech: 'Noun' }),
					lookup_result('king', { part_of_speech: 'Verb' }),
				],
			}),
			create_lookup_token('wine', { lookup_results: [lookup_result('wine', { part_of_speech: 'Noun' })] }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES }).flatMap(flatten_sentence)
		expect(checked_tokens[0].lookup_results.length).toBe(1)
		expect(checked_tokens[0].lookup_results[0].part_of_speech).toBe('Noun')
	})
})
