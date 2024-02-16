import {parse} from '.'
import {describe, expect, test} from 'vitest'
import {TOKEN_TYPE, create_token} from './token'
import {ERRORS} from './error_messages'

/**
 * 
 * @param {string} token 
 * @param {string?} lookup_term 
 * @returns 
 */
function create_word_token(token, lookup_term=null) {
	return create_token(token, TOKEN_TYPE.LOOKUP_WORD, {lookup_term: lookup_term || token})
}

describe('parse', () => {
	describe('no problems', () => {
		test('empty string', () => {
			expect(parse('')).toEqual([])
		})

		test('whitespace', () => {
			expect(parse(' ')).toEqual([])
		})

		test('Token.', () => {
			expect(parse('Token.')).toEqual([
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			])
		})

		test('Token1 token2.', () => {
			expect(parse('Token1 token2.')).toEqual([
				create_word_token('Token1'),
				create_word_token('token2'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			])
		})

		test('Ok _notesNotation [fixedbracket you(Paul)].', () => {
			const results = parse('Ok _notesNotation [fixedbracket you(Paul)].')

			expect(results).length(7)
			expect(results[0].token).toBe('Ok')
			expect(results[0].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].type).toBe(TOKEN_TYPE.NOTE)
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul)')
			expect(results[4].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe(']')
			expect(results[5].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[5].message).toBe('')
			expect(results[6].token).toBe('.')
			expect(results[6].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[6].message).toBe('')
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

		test('You(people) are being stupid/foolish."', () => {
			const results = parse('You(people) are being stupid/foolish."')

			expect(results).length(6)
			expect(results[0].token).toBe('You(people)')
			expect(results[0].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('are')
			expect(results[1].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('being')
			expect(results[2].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('stupid/foolish')
			expect(results[3].type).toBe(TOKEN_TYPE.PAIRING)
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('.')
			expect(results[4].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('"')
			expect(results[5].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[5].message).toBe('')
		})

		test('John said, ["What do you(person) want?"] Then that person took the book [that John had].', () => {
			const results = parse('John said, ["What do you(person) want?"] Then that person took the book [that John had].')

			expect(results).length(24)
			for (let token of results) {
				expect(token.message).toBe('')
			}
		})
	})

	describe('problems detected', () => {
		test('bad_notesNotation[badbracket you', () => {
			const results = parse('bad_notesNotation[badbracket you')

			expect(results).length(4)
			expect(results[0].token).toBe('bad_notesNotation[badbracket')
			expect(results[0].message).toEqual(ERRORS.NO_SPACE_BEFORE_UNDERSCORE)
			expect(results[1].token).toBe('you')
			expect(results[1].message).toMatch(/^Second person pronouns/)
			expect(results[2].token).toBe(']')
			expect(results[2].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[3].token).toBe('.')
			expect(results[3].message).toEqual(ERRORS.MISSING_PERIOD)
		})

		test('Ok _notesNotation text[badbracket you', () => {
			const results = parse('Ok _notesNotation text[badbracket you')

			expect(results).length(7)
			expect(results[0].token).toBe('Ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('text[')
			expect(results[2].message).toEqual(ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET)
			expect(results[3].token).toBe('badbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you')
			expect(results[4].message).toMatch(/^Second person pronouns/)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[6].token).toBe('.')
			expect(results[6].message).toEqual(ERRORS.MISSING_PERIOD)
		})

		test('Ok _notesNotation [fixedbracket you', () => {
			const results = parse('Ok _notesNotation [fixedbracket you')

			expect(results).length(7)
			expect(results[0].token).toBe('Ok')
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
			expect(results[5].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[6].token).toBe('.')
			expect(results[6].message).toEqual(ERRORS.MISSING_PERIOD)
		})

		test('Ok _notesNotation [fixedbracket you(Paul', () => {
			const results = parse('Ok _notesNotation [fixedbracket you(Paul')

			expect(results).length(7)
			expect(results[0].token).toBe('Ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul')
			expect(results[4].message).toEqual(ERRORS.MISSING_CLOSING_PAREN)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[6].token).toBe('.')
			expect(results[6].message).toEqual(ERRORS.MISSING_PERIOD)
		})

		test('Ok _notesNotation [fixedbracket you(Paul).', () => {
			const results = parse('Ok _notesNotation [fixedbracket you(Paul)')

			expect(results).length(7)
			expect(results[0].token).toBe('Ok')
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
			expect(results[5].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[6].token).toBe('.')
			expect(results[6].message).toEqual(ERRORS.MISSING_PERIOD)
		})

		test('Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse('Paul explained [the Christ needed to become alive again]].')

			expect(results).length(14)
			expect(results[0].token).toBe('[')
			expect(results[0].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)
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

		test('John said, ["what do you(person) want?" then that person took the book that John had]', () => {
			const results = parse('John said, ["what do you(person) want?" then that person took the book that John had]')
	
			expect(results).length(24)
			expect(results[0].token).toBe('John')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('said')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe(',')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('"')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('what')
			expect(results[5].message).toEqual(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(results[6].token).toBe('do')
			expect(results[6].message).toBe('')
			expect(results[7].token).toBe('you(person)')
			expect(results[7].message).toBe('')
			expect(results[8].token).toBe('want')
			expect(results[8].message).toBe('')
			expect(results[9].token).toBe('?')
			expect(results[9].message).toBe('')
			expect(results[10].token).toBe('"')
			expect(results[10].message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[12].token).toBe('[')
			expect(results[12].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)
			expect(results[13].token).toBe('then')
			expect(results[13].message).toEqual(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(results[14].token).toBe('that')
			expect(results[14].message).toBe('')
			expect(results[15].token).toBe('person')
			expect(results[15].message).toBe('')
			expect(results[16].token).toBe('took')
			expect(results[16].message).toBe('')
			expect(results[17].token).toBe('the')
			expect(results[17].message).toBe('')
			expect(results[18].token).toBe('book')
			expect(results[18].message).toBe('')
			expect(results[19].token).toBe('that')
			expect(results[19].message).toBe('')
			expect(results[20].token).toBe('John')
			expect(results[20].message).toBe('')
			expect(results[21].token).toBe('had')
			expect(results[21].message).toBe('')
			expect(results[22].token).toBe(']')
			expect(results[22].message).toBe('')
			expect(results[23].token).toBe('.')
			expect(results[23].message).toEqual(ERRORS.MISSING_PERIOD)
		})
	})

	describe('alternate lookups', () => {
		test('alternate lookups', () => {
			const results = parse('John ran [in order to escape many bears].')

			expect(results).length(9)
			expect(results[0].token).toBe('John')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('ran')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('in order to')
			expect(results[3].lookup_term).toBe('in-order-to')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('escape')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('many')
			expect(results[5].lookup_term).toBe('much-many')
			expect(results[5].message).toBe('')
			expect(results[6].token).toBe('bears')
			expect(results[6].message).toBe('')
			expect(results[7].token).toBe(']')
			expect(results[7].message).toBe('')
			expect(results[8].token).toBe('.')
			expect(results[8].message).toBe('')
		})
	})
})
