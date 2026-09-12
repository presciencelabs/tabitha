import { TOKEN_TYPE, create_token, flatten_sentence } from '../token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { PART_OF_SPEECH_RULES } from './part_of_speech_rules'
import { expect_error, create_sentence_for_test, create_pairing_token_for_test, create_lookup_token_for_test, lookup_result_for_test } from '$lib/test_helps'

describe('pairing part_of_speech disambiguation', () => {
	test('both words fully match part_of_speech', () => {
		const test_tokens = [create_sentence_for_test([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token_for_test({
				left: create_lookup_token_for_test({ token: 'first', lookup_results: [lookup_result_for_test({ stem: 'first', level: 1 })] }),
				right: create_lookup_token_for_test({ token: 'second', lookup_results: [lookup_result_for_test({ stem: 'second', level: 2 })] }),
			}),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES })

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with one part_of_speech', () => {
		const test_tokens = [create_sentence_for_test([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token_for_test({
				left: create_lookup_token_for_test({ token: 'first', lookup_results: [
					lookup_result_for_test({ stem: 'first', part_of_speech: 'Noun', level: 1 }),
					lookup_result_for_test({ stem: 'first', part_of_speech: 'Verb', level: 1 }),
				] }),
				right: create_lookup_token_for_test({ token: 'second', lookup_results: [
					lookup_result_for_test({ stem: 'second', part_of_speech: 'Verb', level: 2 }),
					lookup_result_for_test({ stem: 'second', part_of_speech: 'Adjective', level: 2 }),
				] }),
			}),
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
		const test_tokens = [create_sentence_for_test([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token_for_test({
				left: create_lookup_token_for_test({ token: 'first', lookup_results: [
					lookup_result_for_test({ stem: 'first', part_of_speech: 'Noun', level: 1 }),
					lookup_result_for_test({ stem: 'first', part_of_speech: 'Verb', level: 1 }),
				] }),
				right: create_lookup_token_for_test({ token: 'second', lookup_results: [
					lookup_result_for_test({ stem: 'second', part_of_speech: 'Verb', level: 2 }),
					lookup_result_for_test({ stem: 'second', part_of_speech: 'Noun', level: 2 }),
				] }),
			}),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES })

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with no part_of_speech', () => {
		const test_tokens = [create_sentence_for_test([
			create_token({ token: 'A', type: TOKEN_TYPE.FUNCTION_WORD }),
			create_pairing_token_for_test({
				left: create_lookup_token_for_test({ token: 'first', lookup_results: [
					lookup_result_for_test({ stem: 'first', part_of_speech: 'Noun', level: 1 }),
					lookup_result_for_test({ stem: 'first', part_of_speech: 'Adverb', level: 1 }),
				] }),
				right: create_lookup_token_for_test({ token: 'second', lookup_results: [
					lookup_result_for_test({ stem: 'second', part_of_speech: 'Adjective', level: 2 }),
					lookup_result_for_test({ stem: 'second', part_of_speech: 'Adposition', level: 2 }),
				] }),
			}),
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
		const test_tokens = [create_sentence_for_test([
			create_lookup_token_for_test({
				token: "king's",
				tag: { relation: 'genitive_saxon' },
				lookup_results: [
					lookup_result_for_test({ stem: 'king', part_of_speech: 'Noun' }),
					lookup_result_for_test({ stem: 'king', part_of_speech: 'Verb' }),
				],
			}),
			create_lookup_token_for_test({ token: 'wine', lookup_results: [lookup_result_for_test({ stem: 'wine', part_of_speech: 'Noun' })] }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		])]

		const checked_tokens = apply_rules({ sentences: test_tokens, rules: PART_OF_SPEECH_RULES }).flatMap(flatten_sentence)
		expect(checked_tokens[0].lookup_results.length).toBe(1)
		expect(checked_tokens[0].lookup_results[0].part_of_speech).toBe('Noun')
	})
})
