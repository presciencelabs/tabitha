import {tokenize_input, tokenize_punctuation} from './tokenize'
import {describe, expect, test} from 'vitest'

describe('tokenize_input', () => {
	test("'' should return an empty array", () => {
		const INPUT = ''

		/** @type {any[]} */
		const EXPECTED_OUTPUT = []

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a b' should return two tokens: a and b", () => {
		const INPUT = 'a b'

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a      b' should return two tokens: a and b", () => {
		const INPUT = `a
		b`

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a<tab>b' should return two tokens: a and b", () => {
		const INPUT = 'a	b'

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a<tab><tab>b' should return two tokens: a and b", () => {
		const INPUT = 'a		b'

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a<newline>b' should return two tokens: a and b", () => {
		const INPUT = `a
		b`

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a<newline><newline>b' should return two tokens: a and b", () => {
		const INPUT = `a

		b`

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("'a<tab>   b<newline>   c   d' should return 4 tokens: a, b, c, and d", () => {
		const INPUT = `a	   b
		   c   d`

		// prettier-ignore
		/** @type {Token[]} */
		const EXPECTED_OUTPUT = [
			'a',
			'b',
			'c',
			'd',
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})
})

describe('tokenize_punctuation', () => {
	test('tokens with messages should not be changed', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: '[token',
				message: 'some message',
			},
		]

		expect(tokenize_punctuation(test_tokens)[0]).toEqual(test_tokens[0])
	})

	test('[ does not need to be split', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: '[',
				message: '',
			},
		]

		expect(tokenize_punctuation(test_tokens)).toEqual(test_tokens)
	})

	test('token does not need to be split', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'token',
				message: '',
			},
		]

		expect(tokenize_punctuation(test_tokens)).toEqual(test_tokens)
	})

	test('(token) does not need to be split', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: '(token)',
				message: '',
			},
		]

		expect(tokenize_punctuation(test_tokens)).toEqual(test_tokens)
	})

	test('[token should be split into two tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: '[token',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(2)
		expect(checked_tokens[0]).toEqual({token: '[', message: ''})
		expect(checked_tokens[1]).toEqual({token: 'token', message: ''})
	})

	test('token] should be split into two tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'token]',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(2)
		expect(checked_tokens[0]).toEqual({token: 'token', message: ''})
		expect(checked_tokens[1]).toEqual({token: ']', message: ''})
	})

	test('token]] should be split into three tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'token]]',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(3)
		expect(checked_tokens[0]).toEqual({token: 'token', message: ''})
		expect(checked_tokens[1]).toEqual({token: ']', message: ''})
		expect(checked_tokens[2]).toEqual({token: ']', message: ''})
	})

	test('token, should be split into two tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'token,',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(2)
		expect(checked_tokens[0]).toEqual({token: 'token', message: ''})
		expect(checked_tokens[1]).toEqual({token: ',', message: ''})
	})

	test('token. should be split into two tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'token.',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(2)
		expect(checked_tokens[0]).toEqual({token: 'token', message: ''})
		expect(checked_tokens[1]).toEqual({token: '.', message: ''})
	})

	test('token]]]. should be split into five tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'token]]].',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(5)
		expect(checked_tokens[0]).toEqual({token: 'token', message: ''})
		expect(checked_tokens[1]).toEqual({token: ']', message: ''})
		expect(checked_tokens[2]).toEqual({token: ']', message: ''})
		expect(checked_tokens[3]).toEqual({token: ']', message: ''})
		expect(checked_tokens[4]).toEqual({token: '.', message: ''})
	})

	test('[token]. should be split into four tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: '[token].',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(4)
		expect(checked_tokens[0]).toEqual({token: '[', message: ''})
		expect(checked_tokens[1]).toEqual({token: 'token', message: ''})
		expect(checked_tokens[2]).toEqual({token: ']', message: ''})
		expect(checked_tokens[3]).toEqual({token: '.', message: ''})
	})

	test('teaching/preaching]]. should be split into four tokens', () => {
		/** @type {CheckedToken[]} */
		const test_tokens = [
			{
				token: 'teaching/preaching]].',
				message: '',
			},
		]

		const checked_tokens = tokenize_punctuation(test_tokens)

		expect(checked_tokens).length(4)
		expect(checked_tokens[0]).toEqual({token: 'teaching/preaching', message: ''})
		expect(checked_tokens[1]).toEqual({token: ']', message: ''})
		expect(checked_tokens[2]).toEqual({token: ']', message: ''})
		expect(checked_tokens[3]).toEqual({token: '.', message: ''})
	})
})
