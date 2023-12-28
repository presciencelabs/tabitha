import {check_balancing} from './balancing'
import {describe, expect, test} from 'vitest'

describe('balancing: parentheses', () => {
	describe('balanced', () => {
		// prettier-ignore
		test.each([
			['token'],
			['(token)'],
			['(token)(token)'],
			['(token(token))']
		])('%s', token => {
			const test_token = [
				{
					token,
					message: '',
				},
			]

			expect(check_balancing(test_token)).toEqual(test_token)
		})
	})

	describe('unbalanced', () => {
		// prettier-ignore
		test.each([
			['(token', 'Missing a closing'],
			['(token(token)', 'Missing a closing'],
			['token)', 'Missing an opening'],
			['(token)token)', 'Missing an opening'],
			[')token(', 'out of order'],
		])('%s should have a message: %s', (token, message) => {
			const results = check_balancing([
				{
					token,
					message: '',
				},
			])

			expect(results[0].token).toBe(token)
			expect(results[0].message).toContain(message)
		})
	})

	describe('do not check balancing on tokens already containing an error message', () => {
		// prettier-ignore
		test.each([
			['(x_token'],
			['you)']
		])('%s', token => {
			const test_token = [
				{
					token,
					message: 'already failed a previous check',
				},
			]

			expect(check_balancing(test_token)).toEqual(test_token)
		})
	})
})

describe('balancing: brackets', () => {
	describe('balanced', () => {
		test('token', () => {
			const test_tokens = [
				{
					token: 'token',
					message: '',
				},
			]

			expect(check_balancing(test_tokens)).toEqual(test_tokens)
		})

		test('[token] ', () => {
			const test_tokens = [
				{
					token: '[token]',
					message: '',
				},
			]

			expect(check_balancing(test_tokens)).toEqual(test_tokens)
		})

		test('[token] [token]', () => {
			const test_tokens = [
				{
					token: '[token]',
					message: '',
				},
				{
					token: '[token]',
					message: '',
				},
			]

			expect(check_balancing(test_tokens)).toEqual(test_tokens)
		})

		test('[token [token]]', () => {
			const test_tokens = [
				{
					token: '[token',
					message: '',
				},
				{
					token: '[token]]',
					message: '',
				},
			]

			expect(check_balancing(test_tokens)).toEqual(test_tokens)
		})

		test('[token [token] [token [token]]]', () => {
			const test_tokens = [
				{
					token: '[token',
					message: '',
				},
				{
					token: '[token]',
					message: '',
				},
				{
					token: '[token',
					message: '',
				},
				{
					token: '[token]]]',
					message: '',
				},
			]

			expect(check_balancing(test_tokens)).toEqual(test_tokens)
		})
	})

	describe('unbalanced', () => {
		test('[token => should result in an extra "]" token at the end with the appropriate message', () => {
			const test_tokens = [
				{
					token: '[token',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0]).toEqual(test_tokens[0])

			expect(checked_tokens[1].token).toBe(']')
			expect(checked_tokens[1].message).toMatch(/^Missing a closing/)
		})

		test('[token [token] => should result in an extra "]" token at the end with the appropriate message', () => {
			const test_tokens = [
				{
					token: '[token',
					message: '',
				},
				{
					token: '[token]',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])

			expect(checked_tokens[2].token).toBe(']')
			expect(checked_tokens[2].message).toMatch(/^Missing a closing/)
		})

		test('token] => should result in an extra "[" token at the beginning with the appropriate message', () => {
			const test_tokens = [
				{
					token: 'token]',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toMatch(/^Missing an opening/)

			expect(checked_tokens[1]).toEqual(test_tokens[0])
		})

		test('[token] token] => should result in an extra "[" token at the beginning with the appropriate message', () => {
			const test_tokens = [
				{
					token: '[token]',
					message: '',
				},
				{
					token: 'token]',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toMatch(/^Missing an opening/)

			expect(checked_tokens[1]).toEqual(test_tokens[0])
			expect(checked_tokens[2]).toEqual(test_tokens[1])
		})

		// note: it doesn't hurt to test this but it should not be possible if the syntax check was already run since '[' must have a space before it.
		test(' ]token[ => should result in extra tokens at the beginning AND the end the appropriate messages', () => {
			const test_tokens = [
				{
					token: ']token[',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toMatch(/^Missing an opening/)

			expect(checked_tokens[1]).toEqual(test_tokens[0])

			expect(checked_tokens[2].token).toBe(']')
			expect(checked_tokens[2].message).toMatch(/^Missing a closing/)
		})

		test('[[[token] => should result in extra "]" tokens at the end with the appropriate message', () => {
			const test_tokens = [
				{
					token: '[[[token]',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0]).toEqual(test_tokens[0])

			expect(checked_tokens[1].token).toBe(']')
			expect(checked_tokens[1].message).toMatch(/^Missing a closing/)
			expect(checked_tokens[2].token).toBe(']')
			expect(checked_tokens[2].message).toMatch(/^Missing a closing/)
		})

		test('[token]]] => should result in extra "[" tokens at the begining with the appropriate message', () => {
			const test_tokens = [
				{
					token: '[token]]]',
					message: '',
				},
			]

			const checked_tokens = check_balancing(test_tokens)

			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toMatch(/^Missing an opening/)
			expect(checked_tokens[1].token).toBe('[')
			expect(checked_tokens[1].message).toMatch(/^Missing an opening/)

			expect(checked_tokens[2]).toEqual(test_tokens[0])
		})
	})
})
