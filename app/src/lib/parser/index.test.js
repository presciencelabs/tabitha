import {parse} from '.'
import {describe, expect, test} from 'vitest'

describe('parse', () => {
	describe('no problems', () => {
		test('empty string', () => {
			expect(parse('')).toEqual([])
		})

		test('whitespace', () => {
			expect(parse(' ')).toEqual([])
		})

		test('token', () => {
			expect(parse('token')).toEqual([
				{
					token: 'token',
					message: '',
				},
			])
		})

		test('token1 token2', () => {
			expect(parse('token1 token2')).toEqual([
				{
					token: 'token1',
					message: '',
				},
				{
					token: 'token2',
					message: '',
				},
			])
		})

		test('ok _notesNotation [fixedbracket you(Paul)]', () => {
			const results = parse('ok _notesNotation [fixedbracket you(Paul)]')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul)')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe(']')
			expect(results[5].message).toBe('')
		})

		test('[Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse('[Paul explained [the Christ needed to become alive again]].')

			expect(results).length(14)
			expect(results[0].token).toBe('[')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('Paul')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('explained')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('the')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('Christ')
			expect(results[5].message).toBe('')
			expect(results[6].token).toBe('needed')
			expect(results[6].message).toBe('')
			expect(results[7].token).toBe('to')
			expect(results[7].message).toBe('')
			expect(results[8].token).toBe('become')
			expect(results[8].message).toBe('')
			expect(results[9].token).toBe('alive')
			expect(results[9].message).toBe('')
			expect(results[10].token).toBe('again')
			expect(results[10].message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].message).toBe('')
			expect(results[12].token).toBe(']')
			expect(results[12].message).toBe('')
			expect(results[13].token).toBe('.')
			expect(results[13].message).toBe('')
		})
	})

	describe('problems detected', () => {
		test('bad_notesNotation[badbracket you', () => {
			const results = parse('bad_notesNotation[badbracket you')

			expect(results).length(3)
			expect(results[0].token).toBe('bad_notesNotation[badbracket')
			expect(results[0].message).toMatch(/^Notes notation/)
			expect(results[1].token).toBe('you')
			expect(results[1].message).toMatch(/^Second person pronouns/)
			expect(results[2].token).toBe(']')
			expect(results[2].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation[badbracket you', () => {
			const results = parse('ok _notesNotation[badbracket you')

			expect(results).length(4)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation[badbracket')
			expect(results[1].message).toMatch(/^Subordinate clauses/)
			expect(results[2].token).toBe('you')
			expect(results[2].message).toMatch(/^Second person pronouns/)
			expect(results[3].token).toBe(']')
			expect(results[3].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation [fixedbracket you', () => {
			const results = parse('ok _notesNotation [fixedbracket you')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you')
			expect(results[4].message).toMatch(/^Second person pronouns/)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation [fixedbracket you(Paul', () => {
			const results = parse('ok _notesNotation [fixedbracket you(Paul')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul')
			expect(results[4].message).toMatch(/^Missing a closing parenthesis/)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation [fixedbracket you(Paul)', () => {
			const results = parse('ok _notesNotation [fixedbracket you(Paul)')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul)')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse('Paul explained [the Christ needed to become alive again]].')

			expect(results).length(14)
			expect(results[0].token).toBe('[')
			expect(results[0].message).toMatch(/^Missing an opening bracket/)
			expect(results[1].token).toBe('Paul')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('explained')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('the')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('Christ')
			expect(results[5].message).toBe('')
			expect(results[6].token).toBe('needed')
			expect(results[6].message).toBe('')
			expect(results[7].token).toBe('to')
			expect(results[7].message).toBe('')
			expect(results[8].token).toBe('become')
			expect(results[8].message).toBe('')
			expect(results[9].token).toBe('alive')
			expect(results[9].message).toBe('')
			expect(results[10].token).toBe('again')
			expect(results[10].message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].message).toBe('')
			expect(results[12].token).toBe(']')
			expect(results[12].message).toBe('')
			expect(results[13].token).toBe('.')
			expect(results[13].message).toBe('')
		})
	})
})
