import {TOKEN_TYPE, create_error_token, create_token} from './token'
import {check_invalid_tokens, check_sentence_syntax, check_syntax} from './syntax'
import {ERRORS} from './error_messages'
import {describe, expect, test} from 'vitest'

/**
 * 
 * @param {string[]} tokens
 * @returns {Token[]}
 */
function create_tokens(tokens) {
	/** @type {(token: string) => TokenType} */
	const type = token => token.length > 1 ? TOKEN_TYPE.LOOKUP_WORD : TOKEN_TYPE.PUNCTUATION
	return tokens.map(token => {return create_token(token, type(token))})
}

/**
 * 
 * @param {string} token 
 * @param {string?} lookup_term 
 */
function create_word_token(token, lookup_term=null) {
	return create_token(token, TOKEN_TYPE.LOOKUP_WORD, {lookup_term: lookup_term || token})
}

/**
 * 
 * @param {number} index 
 * @param {string} message 
 * @param {Token[]} tokens 
 */
function expect_error_at(index, message, tokens) {
	for (let [i, token] of tokens.entries()) {
		if (i == index) {
			expect(token.message).toEqual(message)
		} else {
			expect(token.message).toBe('')
		}
	}
}

describe('invalid tokens: pronouns', () => {
	describe('valid', () => {
		// prettier-ignore
		test.each([
			[create_tokens(['I(Paul)'])],
			[create_tokens(['You(Paul)'])],
			[create_tokens(['Capitalized', 'you(Paul)'])],
			[create_tokens(['Capitalized', 'we(people)'])],
			[create_tokens(['Capitalized', 'her(Mary)'])],
		])('%s', test_tokens => {
			const EXPECTED_OUTPUT = test_tokens

			expect(check_invalid_tokens(test_tokens)).toEqual(EXPECTED_OUTPUT)
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
			const checked_tokens = check_invalid_tokens(test_tokens)

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
			const checked_tokens = check_invalid_tokens(test_tokens)

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
			const checked_tokens = check_invalid_tokens(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect(checked_tokens[0].message).toMatch(/^Third person pronouns/)
		})
	})
})

describe('balancing: brackets', () => {
	describe('balanced', () => {
		test('token', () => {
			const test_tokens = create_tokens(['Token','.'])

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})

		test('[token] ', () => {
			const test_tokens = create_tokens(['[','Token',']','.'])

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})

		test('[token] [token]', () => {
			const test_tokens = create_tokens(['[','Token',']','[','Token',']','.'])

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})

		test('[token [token]]', () => {
			const test_tokens = create_tokens(['[','Token','[','Token',']', ']','.'])

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})

		test('[bad[token]]', () => {
			const test_tokens = create_tokens(['[','bad[','Token',']', ']','.'])

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})

		test('[token [token] [token [token]]]', () => {
			const test_tokens = create_tokens(['[','Token','[','Token',']','[','Token','[','Token',']',']',']','.'])

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
	})

	describe('unbalanced single sentence', () => {
		test('[token => should result in an extra "]" token at the end with the appropriate message', () => {
			const test_tokens = create_tokens(['[','Token','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(4)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])
			expect(checked_tokens[2]).toEqual(test_tokens[2])

			expect(checked_tokens[3].token).toBe(']')
			expect(checked_tokens[3].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
		})

		test('[token [token] => should result in an extra "]" token at the end with the appropriate message', () => {
			const test_tokens = create_tokens(['[','Token','[','Token',']','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(7)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])
			expect(checked_tokens[2]).toEqual(test_tokens[2])
			expect(checked_tokens[3]).toEqual(test_tokens[3])
			expect(checked_tokens[4]).toEqual(test_tokens[4])
			expect(checked_tokens[5]).toEqual(test_tokens[5])

			expect(checked_tokens[6].token).toBe(']')
			expect(checked_tokens[6].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
		})

		test('token] => should result in an extra "[" token at the beginning with the appropriate message', () => {
			const test_tokens = create_tokens(['Token',']','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(4)
			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)

			expect(checked_tokens[1]).toEqual(test_tokens[0])
			expect(checked_tokens[2]).toEqual(test_tokens[1])
		})

		test('[token] token] => should result in an extra "[" token at the beginning with the appropriate message', () => {
			const test_tokens = create_tokens(['[','Token',']','Token',']','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(7)
			expect(checked_tokens[0].token).toBe('[')
			expect(checked_tokens[0].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)

			expect(checked_tokens[1]).toEqual(test_tokens[0])
			expect(checked_tokens[2]).toEqual(test_tokens[1])
			expect(checked_tokens[3]).toEqual(test_tokens[2])
			expect(checked_tokens[4]).toEqual(test_tokens[3])
			expect(checked_tokens[5]).toEqual(test_tokens[4])
			expect(checked_tokens[6]).toEqual(test_tokens[5])
		})

		test('[[[token] => should result in extra "]" tokens at the end with the appropriate message', () => {
			const test_tokens = create_tokens(['[','[','[','Token',']','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(8)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])
			expect(checked_tokens[2]).toEqual(test_tokens[2])
			expect(checked_tokens[3]).toEqual(test_tokens[3])
			expect(checked_tokens[4]).toEqual(test_tokens[4])
			expect(checked_tokens[5]).toEqual(test_tokens[5])

			expect(checked_tokens[6].token).toBe(']')
			expect(checked_tokens[6].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(checked_tokens[7].token).toBe(']')
			expect(checked_tokens[7].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
		})

		test('[token]]] => should result in extra "[" tokens at the begining with the appropriate message', () => {
			const test_tokens = create_tokens(['[','Token',']',']',']','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(8)
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
	describe('unbalanced multiple sentence', () => {
		test('["Token?" Token. => should result in an extra "]" token after the first sentence', () => {
			const test_tokens = create_tokens(['[','"','Token','?','"','Token','.'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(8)
			expect(checked_tokens[5].token).toBe(']')
			expect_error_at(5, ERRORS.MISSING_CLOSING_BRACKET, checked_tokens)
		})
		test('Token. Token.] => should result in an extra "]" token before the second sentence', () => {
			const test_tokens = create_tokens(['Token','.','Token','.',']'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(6)
			expect(checked_tokens[2].token).toBe('[')
			expect_error_at(2, ERRORS.MISSING_OPENING_BRACKET, checked_tokens)
		})
		test('[Token. Token.] => should result in an extra "]" and "[" tokens between sentences', () => {
			const test_tokens = create_tokens(['[','Token','.','Token','.',']'])

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens.length).toEqual(8)
			expect(checked_tokens[0]).toEqual(test_tokens[0])
			expect(checked_tokens[1]).toEqual(test_tokens[1])
			expect(checked_tokens[2]).toEqual(test_tokens[2])
			expect(checked_tokens[3].token).toBe(']')
			expect(checked_tokens[3].message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(checked_tokens[4].token).toBe('[')
			expect(checked_tokens[4].message).toEqual(ERRORS.MISSING_OPENING_BRACKET)
			expect(checked_tokens[5]).toEqual(test_tokens[3])
			expect(checked_tokens[6]).toEqual(test_tokens[4])
			expect(checked_tokens[7]).toEqual(test_tokens[5])
		})
	})
})

describe('sentence syntax: period', () => {
	describe('valid ending', () => {
		test('Token.', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('Token?', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('?', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('[Token.]', () => {
			const test_tokens = [
				create_token('[', TOKEN_TYPE.PUNCTUATION),
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_token(']', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('Token."', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_token('"', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('[Token.]"', () => {
			const test_tokens = [
				create_token('[', TOKEN_TYPE.PUNCTUATION),
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_token(']', TOKEN_TYPE.PUNCTUATION),
				create_token('"', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
	})
	
	describe('missing ending', () => {
		test('Token', () => {
			const test_tokens = [
				create_word_token('Token'),
			]

			const expected_tokens = [
				...test_tokens,
				create_error_token('.', ERRORS.MISSING_PERIOD)
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(expected_tokens)
		})
		test('Token. Token', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_word_token('Token'),
			]

			const expected_tokens = [
				...test_tokens,
				create_error_token('.', ERRORS.MISSING_PERIOD)
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(expected_tokens)
		})
		test('[Token]', () => {
			const test_tokens = [
				create_token('[', TOKEN_TYPE.PUNCTUATION),
				create_word_token('Token'),
				create_token(']', TOKEN_TYPE.PUNCTUATION),
			]

			const expected_tokens = [
				...test_tokens,
				create_error_token('.', ERRORS.MISSING_PERIOD)
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(expected_tokens)
		})
		test('Token"', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('"', TOKEN_TYPE.PUNCTUATION),
			]

			const expected_tokens = [
				...test_tokens,
				create_error_token('.', ERRORS.MISSING_PERIOD)
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(expected_tokens)
		})
	})
})

describe('sentence syntax: capitalization', () => {
	describe('valid', () => {
		test('. empty sentence', () => {
			const test_tokens = [
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('Token token.', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('Token. Token.', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('.5 token. numbers don\'t need to be checked', () => {
			const test_tokens = [
				create_word_token('.5'),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('100 token. numbers don\'t need to be checked', () => {
			const test_tokens = [
				create_word_token('100'),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('_note Token. notes get skipped over', () => {
			const test_tokens = [
				create_token('_note', TOKEN_TYPE.NOTE),
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('(imp) Token. notes get skipped over', () => {
			const test_tokens = [
				create_token('(imp)', TOKEN_TYPE.NOTE),
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('Token. _note Token.', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_token('_note', TOKEN_TYPE.NOTE),
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('To token. function words get checked', () => {
			const test_tokens = [
				create_token('To', TOKEN_TYPE.FUNCTION_WORD),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
		test('Followers/disciples token. pairings get checked', () => {
			const test_tokens = [
				create_token('Followers/disciples', TOKEN_TYPE.PAIRING),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			expect(check_sentence_syntax(test_tokens)).toEqual(test_tokens)
		})
	})

	describe('invalid', () => {
		test('token.', () => {
			const test_tokens = [
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(0, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('Token. token.', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(2, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('_note token. notes get skipped over', () => {
			const test_tokens = [
				create_token('_note', TOKEN_TYPE.NOTE),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(1, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('(imp) token. notes get skipped over', () => {
			const test_tokens = [
				create_token('(imp)', TOKEN_TYPE.NOTE),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(1, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('Token. _note token.', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
				create_token('_note', TOKEN_TYPE.NOTE),
				create_word_token('token'),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(3, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('to. function words get checked', () => {
			const test_tokens = [
				create_token('to', TOKEN_TYPE.FUNCTION_WORD),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(0, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('followers/disciples. pairings get checked', () => {
			const test_tokens = [
				create_token('followers/disciples', TOKEN_TYPE.PAIRING),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(0, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('[token]. punctuation is skipped over', () => {
			const test_tokens = [
				create_token('[', TOKEN_TYPE.PUNCTUATION),
				create_word_token('token'),
				create_token(']', TOKEN_TYPE.PUNCTUATION),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(1, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('Token, ["hello"]. beginning of quote is checked', () => {
			const test_tokens = [
				create_word_token('Token'),
				create_token(',', TOKEN_TYPE.PUNCTUATION),
				create_token('[', TOKEN_TYPE.PUNCTUATION),
				create_token('"', TOKEN_TYPE.PUNCTUATION),
				create_word_token('hello'),
				create_token('"', TOKEN_TYPE.PUNCTUATION),
				create_token(']', TOKEN_TYPE.PUNCTUATION),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]

			const checked_tokens = check_sentence_syntax(test_tokens)

			expect(checked_tokens).length(test_tokens.length)
			expect_error_at(4, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
	})
})
