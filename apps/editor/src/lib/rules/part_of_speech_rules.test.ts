import { TOKEN_TYPE, create_token, flatten_sentence } from '../token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { PART_OF_SPEECH_RULES } from './part_of_speech_rules'
import { expect_error, create_sentence_for_test, create_pairing_token_for_test, create_lookup_token_for_test, lookup_result_for_test } from '$lib/test_helps'
import type { Token } from '$lib/types'

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

describe('Noun-Adjective disambiguation', () => {
	const create_noun_adjective_token = ({ token, stem }: { token: string, stem: string }) => create_lookup_token_for_test({ token, lookup_results: [
		lookup_result_for_test({ stem, part_of_speech: 'Noun' }),
		lookup_result_for_test({ stem, part_of_speech: 'Adjective' }),
	] })
	const create_word_token = ({ token, stem, part_of_speech }: { token: string, stem: string, part_of_speech: 'Noun' | 'Verb' }) =>
		create_lookup_token_for_test({ token, lookup_results: [lookup_result_for_test({ stem, part_of_speech })] })
	const create_article_token = (token: string) => create_token({ token, type: TOKEN_TYPE.FUNCTION_WORD, tag: { determiner: 'definite_article' } })
	const create_function_word_token = (token: string) => create_token({ token, type: TOKEN_TYPE.FUNCTION_WORD })
	const create_period_token = () => create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION })
	const parts_of_speech_after_rules = ({ tokens, index }: { tokens: Token[], index: number }) =>
		apply_rules({ sentences: [create_sentence_for_test(tokens)], rules: PART_OF_SPEECH_RULES })
			.flatMap(flatten_sentence)[index]
			.lookup_results.map(result => result.part_of_speech)

	test('Noun-Adjective followed by a Verb is a Noun: Silver belongs to God. (cf. Haggai 2:8)', () => {
		const tokens = [
			create_noun_adjective_token({ token: 'Silver', stem: 'silver' }),
			create_word_token({ token: 'belongs', stem: 'belong', part_of_speech: 'Verb' }),
			create_function_word_token('to'),
			create_word_token({ token: 'God', stem: 'God', part_of_speech: 'Noun' }),
			create_period_token(),
		]

		expect(parts_of_speech_after_rules({ tokens, index: 0 })).toEqual(['Noun'])
	})
	test('Noun-Adjective preceded by "be" stays an Adjective: Their idols are silver. (Psalm 115:4)', () => {
		const tokens = [
			create_function_word_token('Their'),
			create_word_token({ token: 'idols', stem: 'idol', part_of_speech: 'Noun' }),
			create_word_token({ token: 'are', stem: 'be', part_of_speech: 'Verb' }),
			create_noun_adjective_token({ token: 'silver', stem: 'silver' }),
			create_period_token(),
		]

		expect(parts_of_speech_after_rules({ tokens, index: 3 })).toEqual(['Adjective'])
	})
	test('"life" followed by a Verb is a Noun: Life is in the blood. (cf. Leviticus 17:11)', () => {
		const tokens = [
			create_noun_adjective_token({ token: 'Life', stem: 'life' }),
			create_word_token({ token: 'is', stem: 'be', part_of_speech: 'Verb' }),
			create_function_word_token('in'),
			create_article_token('the'),
			create_word_token({ token: 'blood', stem: 'blood', part_of_speech: 'Noun' }),
			create_period_token(),
		]

		expect(parts_of_speech_after_rules({ tokens, index: 0 })).toEqual(['Noun'])
	})
	test('"life" not followed by a Noun is a Noun: God gives life to all people. (cf. Acts 17:25)', () => {
		const tokens = [
			create_word_token({ token: 'God', stem: 'God', part_of_speech: 'Noun' }),
			create_word_token({ token: 'gives', stem: 'give', part_of_speech: 'Verb' }),
			create_noun_adjective_token({ token: 'life', stem: 'life' }),
			create_function_word_token('to'),
			create_function_word_token('all'),
			create_word_token({ token: 'people', stem: 'people', part_of_speech: 'Noun' }),
			create_period_token(),
		]

		expect(parts_of_speech_after_rules({ tokens, index: 2 })).toEqual(['Noun'])
	})
	test('"life" followed by a Noun is an Adjective: The sailors lowered the life boat. (cf. Acts 27:30)', () => {
		const tokens = [
			create_article_token('The'),
			create_word_token({ token: 'sailors', stem: 'sailor', part_of_speech: 'Noun' }),
			create_word_token({ token: 'lowered', stem: 'lower', part_of_speech: 'Verb' }),
			create_article_token('the'),
			create_noun_adjective_token({ token: 'life', stem: 'life' }),
			create_word_token({ token: 'boat', stem: 'boat', part_of_speech: 'Noun' }),
			create_period_token(),
		]

		expect(parts_of_speech_after_rules({ tokens, index: 4 })).toEqual(['Adjective'])
	})
})
