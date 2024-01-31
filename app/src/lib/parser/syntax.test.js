import {TOKEN_TYPE, create_token} from './token'
import {check_for_unbalanced_brackets, check_syntax} from './syntax'
import {ERRORS} from './error_messages'
import {describe, expect, test} from 'vitest'

/**
 * 
 * @param {string[]} tokens
 * @returns {Token[]}
 */
function create_tokens(tokens) {
	return tokens.map(token => {return create_token(token, TOKEN_TYPE.LOOKUP_WORD)})
}

describe('syntax: pronouns', () => {
	describe('valid', () => {
		// prettier-ignore
		test.each([
			[create_tokens(['I(Paul)'])],
			[create_tokens(['You(Paul)'])],
			[create_tokens(['you(Paul)'])],
			[create_tokens(['we(people)'])],
			[create_tokens(['her(Mary)'])],
		])('%s', test_tokens => {
			const EXPECTED_OUTPUT = create_tokens([test_tokens[0].token])

			expect(check_syntax(test_tokens)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('invalid: catches first person (case-insensitive)', () => {
		// prettier-ignore
		test.each([
			[create_tokens(['I', 'i'])],
			[create_tokens(['ME','Me','me'])],
			[create_tokens(['MY','My','my'])],
			[create_tokens(['MINE','Mine','mine'])],
			[create_tokens(['MYSELF','Myself','myself'])],
			[create_tokens(['WE','We','We'])],
			[create_tokens(['US','Us','us'])],
			[create_tokens(['OUR','Our','our'])],
			[create_tokens(['OURS','Ours','ours'])],
			[create_tokens(['OURSELVES','Ourselves','ourselves'])],
		])('%s', test_tokens => {
			const checked_tokens = check_syntax(test_tokens)

			for (let i = 0; i < checked_tokens.length; i++) {
				expect(checked_tokens[i].token).toEqual(test_tokens[i].token)
				expect(checked_tokens[i].message).toMatch(/^First person pronouns/)
			}
		})
	})

	describe('invalid: catches second person (case-insensitive)', () => {
		// prettier-ignore
		test.each([
			[create_tokens(['YOU'])],
			[create_tokens(['You'])],
			[create_tokens(['you'])],
			[create_tokens(['YOUR'])],
			[create_tokens(['Your'])],
			[create_tokens(['your'])],
			[create_tokens(['YOURS'])],
			[create_tokens(['Yours'])],
			[create_tokens(['yours'])],
			[create_tokens(['YOURSELF'])],
			[create_tokens(['Yourself'])],
			[create_tokens(['yourself'])],
		])('%s', test_tokens => {
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect(checked_tokens[0].message).toMatch(/^Second person pronouns/)
		})
	})

	describe('invalid: catches third person (case-insensitive)', () => {
		// prettier-ignore
		test.each([
			[create_tokens(['HE'])],
			[create_tokens(['He'])],
			[create_tokens(['he'])],
			[create_tokens(['HIM'])],
			[create_tokens(['Him'])],
			[create_tokens(['him'])],
			[create_tokens(['HIS'])],
			[create_tokens(['His'])],
			[create_tokens(['his'])],
			[create_tokens(['HIMSELF'])],
			[create_tokens(['Himself'])],
			[create_tokens(['himself'])],
			[create_tokens(['SHE'])],
			[create_tokens(['She'])],
			[create_tokens(['she'])],
			[create_tokens(['HER'])],
			[create_tokens(['Her'])],
			[create_tokens(['her'])],
			[create_tokens(['HERS'])],
			[create_tokens(['Hers'])],
			[create_tokens(['hers'])],
			[create_tokens(['HERSELF'])],
			[create_tokens(['Herself'])],
			[create_tokens(['herself'])],
			[create_tokens(['IT'])],
			[create_tokens(['It'])],
			[create_tokens(['it'])],
			[create_tokens(['ITS'])],
			[create_tokens(['Its'])],
			[create_tokens(['its'])],
			[create_tokens(['ITSELF'])],
			[create_tokens(['Itself'])],
			[create_tokens(['itself'])],
			[create_tokens(['THEY'])],
			[create_tokens(['They'])],
			[create_tokens(['they'])],
			[create_tokens(['THEM'])],
			[create_tokens(['Them'])],
			[create_tokens(['them'])],
			[create_tokens(['THEIR'])],
			[create_tokens(['Their'])],
			[create_tokens(['their'])],
			[create_tokens(['THEIRS'])],
			[create_tokens(['Theirs'])],
			[create_tokens(['theirs'])],
			[create_tokens(['THEMSELVES'])],
			[create_tokens(['Themselves'])],
			[create_tokens(['themselves'])],
		])('%s', test_tokens => {
			const checked_tokens = check_syntax(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect(checked_tokens[0].message).toMatch(/^Third person pronouns/)
		})
	})
})

describe('balancing: brackets', () => {
	describe('balanced', () => {
		test('token', () => {
			const test_tokens = create_tokens(['token'])

			expect(check_for_unbalanced_brackets(test_tokens)).toEqual(test_tokens)
		})

		test('[token] ', () => {
			const test_tokens = create_tokens(['[','token',']'])

			expect(check_for_unbalanced_brackets(test_tokens)).toEqual(test_tokens)
		})

		test('[token] [token]', () => {
			const test_tokens = create_tokens(['[','token',']','[','token',']'])

			expect(check_for_unbalanced_brackets(test_tokens)).toEqual(test_tokens)
		})

		test('[token [token]]', () => {
			const test_tokens = create_tokens(['[','token','[','token',']', ']'])

			expect(check_for_unbalanced_brackets(test_tokens)).toEqual(test_tokens)
		})

		test('[bad[token]]', () => {
			const test_tokens = create_tokens(['[','bad[','token',']', ']'])

			expect(check_for_unbalanced_brackets(test_tokens)).toEqual(test_tokens)
		})

		test('[token [token] [token [token]]]', () => {
			const test_tokens = create_tokens(['[','token','[','token',']','[','token','[','token',']',']',']'])

			expect(check_for_unbalanced_brackets(test_tokens)).toEqual(test_tokens)
		})
	})

	describe('unbalanced', () => {
		test('[token => should result in an extra "]" token at the end with the appropriate message', () => {
			const test_tokens = create_tokens(['[','token'])

			const checked_tokens = check_for_unbalanced_brackets(test_tokens)

			expect(checked_tokens.length).toEqual(3)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])

			expect(checked_tokens[2].token).toBe(']')
			expect(checked_tokens[2].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
		})

		test('[token [token] => should result in an extra "]" token at the end with the appropriate message', () => {
			const test_tokens = create_tokens(['[','token','[','token',']'])

			const checked_tokens = check_for_unbalanced_brackets(test_tokens)

			expect(checked_tokens.length).toEqual(6)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])
			expect(checked_tokens[2]).toEqual(test_tokens[2])
			expect(checked_tokens[3]).toEqual(test_tokens[3])
			expect(checked_tokens[4]).toEqual(test_tokens[4])

			expect(checked_tokens[5].token).toBe(']')
			expect(checked_tokens[5].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
		})

		test('token] => should result in an extra "[" token at the beginning with the appropriate message', () => {
			const test_tokens = create_tokens(['token',']'])

			const checked_tokens = check_for_unbalanced_brackets(test_tokens)

			expect(checked_tokens.length).toEqual(3)
			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)

			expect(checked_tokens[1]).toEqual(test_tokens[0])
			expect(checked_tokens[2]).toEqual(test_tokens[1])
		})

		test('[token] token] => should result in an extra "[" token at the beginning with the appropriate message', () => {
			const test_tokens = create_tokens(['[','token',']','token',']'])

			const checked_tokens = check_for_unbalanced_brackets(test_tokens)

			expect(checked_tokens.length).toEqual(6)
			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)

			expect(checked_tokens[1]).toEqual(test_tokens[0])
			expect(checked_tokens[2]).toEqual(test_tokens[1])
			expect(checked_tokens[3]).toEqual(test_tokens[2])
			expect(checked_tokens[4]).toEqual(test_tokens[3])
			expect(checked_tokens[5]).toEqual(test_tokens[4])
		})

		test('[[[token] => should result in extra "]" tokens at the end with the appropriate message', () => {
			const test_tokens = create_tokens(['[','[','[','token',']'])

			const checked_tokens = check_for_unbalanced_brackets(test_tokens)

			expect(checked_tokens.length).toEqual(7)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])
			expect(checked_tokens[2]).toEqual(test_tokens[2])
			expect(checked_tokens[3]).toEqual(test_tokens[3])
			expect(checked_tokens[4]).toEqual(test_tokens[4])

			expect(checked_tokens[5].token).toBe(']')
			expect(checked_tokens[5].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(checked_tokens[6].token).toBe(']')
			expect(checked_tokens[6].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
		})

		test('[token]]] => should result in extra "[" tokens at the begining with the appropriate message', () => {
			const test_tokens = create_tokens(['[','token',']',']',']'])

			const checked_tokens = check_for_unbalanced_brackets(test_tokens)

			expect(checked_tokens.length).toEqual(7)
			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)
			expect(checked_tokens[1].token).toBe('[')
			expect(checked_tokens[1].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)

			expect(checked_tokens[2]).toEqual(test_tokens[0])
			expect(checked_tokens[3]).toEqual(test_tokens[1])
			expect(checked_tokens[4]).toEqual(test_tokens[2])
			expect(checked_tokens[5]).toEqual(test_tokens[3])
			expect(checked_tokens[6]).toEqual(test_tokens[4])
		})
	})
})
