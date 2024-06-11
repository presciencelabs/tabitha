import { describe, expect, test } from 'vitest'
import { CLAUSE_NOTATIONS } from './clause_notations'
import { ERRORS } from './error_messages'
import { FUNCTION_WORDS } from './function_words'
import { MESSAGE_TYPE, TOKEN_TYPE, create_token } from './token'
import { tokenize_input } from './tokenize'

/**
 * @param {string} token
 * @param {Object} other_data
 * @param {string?} [other_data.lookup_term=null]
 * @param {string} [other_data.sense='']
 * @returns {Token}
 */
function create_word_token(token, { lookup_term=null, sense='' }={}) {
	return create_token(token, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: lookup_term || token, specified_sense: sense })
}

/**
 * @param {Token} left_token
 * @param {Token} right_token
 * @returns {Token}
 */
function create_pairing(left_token, right_token) {
	left_token.complex_pairing = right_token
	return left_token
}

/**
 * @param {string} pronoun
 * @param {Token} referent_token
 * @returns {Token}
 */
function create_pronoun_token(pronoun, referent_token) {
	const pronoun_token = create_token(pronoun, TOKEN_TYPE.FUNCTION_WORD)
	referent_token.pronoun = pronoun_token
	return referent_token
}

/**
 * 
 * @param {string} token 
 * @param {string} message 
 * @returns {Token}
 */
function create_error_token(token, message) {
	return create_token(token, TOKEN_TYPE.NOTE, { message: { ...MESSAGE_TYPE.ERROR, message: message } })
}

describe('tokenize_input', () => {
	test("'' should return an empty array", () => {
		const INPUT = ''

		/** @type {any[]} */
		const EXPECTED_OUTPUT = []

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('any whitespace should split tokens', () => {
		const INPUT = `z b    c
		d	e		  f

		g`

		const EXPECTED_OUTPUT = [
			create_word_token('z'),
			create_word_token('b'),
			create_word_token('c'),
			create_word_token('d'),
			create_word_token('e'),
			create_word_token('f'),
			create_word_token('g'),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid words', () => {
		const INPUT = "token tokens token's token-A token's-A in-order-to Holy-Spirit's token123 123"

		const EXPECTED_OUTPUT = [
			create_word_token('token', { lookup_term: 'token' }),
			create_word_token('tokens', { lookup_term: 'tokens' }),
			create_word_token("token's", { lookup_term: 'token' }),
			create_word_token('token-A', { lookup_term: 'token', sense: 'A' }),
			create_word_token("token's-A", { lookup_term: 'token', sense: 'A' }),
			create_word_token('in-order-to', { lookup_term: 'in-order-to' }),
			create_word_token("Holy-Spirit's", { lookup_term: 'Holy-Spirit' }),
			create_word_token('token123', { lookup_term: 'token123' }),
			create_word_token('123', { lookup_term: '123' }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid words with decimal', () => {
		const INPUT = '2.5 .5 .1. 3.88] 2.5'

		const EXPECTED_OUTPUT = [
			create_word_token('2.5', { lookup_term: '2.5' }),
			create_word_token('.5', { lookup_term: '.5' }),
			create_word_token('.1', { lookup_term: '.1' }),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_word_token('3.88', { lookup_term: '3.88' }),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_word_token('2.5', { lookup_term: '2.5' }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid words', () => {
		const INPUT = '.token ,token token['

		const EXPECTED_OUTPUT = [
			create_error_token('.token', ERRORS.INVALID_TOKEN_END('.')),
			create_error_token(',token', ERRORS.INVALID_TOKEN_END(',')),
			create_error_token('token[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid pronoun referents', () => {
		const INPUT = "you(Paul) abc(test) your(Paul's) your(son-C) your(son's-C) your(sons'-C)] you(Paul)."

		const EXPECTED_OUTPUT = [
			create_pronoun_token('you', create_word_token('Paul')),
			create_pronoun_token('abc', create_word_token('test')),
			create_pronoun_token('your', create_word_token('Paul\'s', { lookup_term: 'Paul' })),
			create_pronoun_token('your', create_word_token('son-C', { lookup_term: 'son', sense: 'C' })),
			create_pronoun_token('your', create_word_token('son\'s-C', { lookup_term: 'son', sense: 'C' })),
			create_pronoun_token('your', create_word_token('sons\'-C', { lookup_term: 'sons', sense: 'C' })),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_pronoun_token('you', create_word_token('Paul')),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid pronoun referents', () => {
		const INPUT = 'you(Paul youPaul) you(Paul)[ you(Paul)_.'

		const EXPECTED_OUTPUT = [
			create_error_token('you(Paul', ERRORS.MISSING_CLOSING_PAREN),
			create_error_token('youPaul)', ERRORS.MISSING_OPENING_PAREN),
			create_error_token('you(Paul)[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
			create_error_token('you(Paul)_', ERRORS.INVALID_TOKEN_END('you(Paul)')),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid underscore notation', () => {
		const INPUT = '_note _note. _note] [_note _note[ __implicit'

		const EXPECTED_OUTPUT = [
			create_token('_note', TOKEN_TYPE.NOTE),
			create_token('_note', TOKEN_TYPE.NOTE),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('_note', TOKEN_TYPE.NOTE),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('_note', TOKEN_TYPE.NOTE),
			create_token('_note', TOKEN_TYPE.NOTE),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('__implicit', TOKEN_TYPE.NOTE), 	// double underscore is fine
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid underscore notation', () => {
		const INPUT = 'token_note token_ ._note ]_note'

		const EXPECTED_OUTPUT = [
			create_error_token('token_note', ERRORS.NO_SPACE_BEFORE_UNDERSCORE),
			create_error_token('token_', ERRORS.INVALID_TOKEN_END('token')),
			create_error_token('._note', ERRORS.NO_SPACE_BEFORE_UNDERSCORE),
			create_error_token(']_note', ERRORS.NO_SPACE_BEFORE_UNDERSCORE),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid clause notation', () => {
		const INPUT = '(imp) (implicit-situational) [(imp) (imp)] (imp).'

		const EXPECTED_OUTPUT = [
			create_token('(imp)', TOKEN_TYPE.NOTE),
			create_token('(implicit-situational)', TOKEN_TYPE.NOTE),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('(imp)', TOKEN_TYPE.NOTE),
			create_token('(imp)', TOKEN_TYPE.NOTE),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token('(imp)', TOKEN_TYPE.NOTE),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	describe('all valid clause notations', () => {
		test.each(CLAUSE_NOTATIONS.map(notation => [[notation]]))('%s', test_text => {
			const EXPECTED_OUTPUT = [
				create_token(test_text[0], TOKEN_TYPE.NOTE),
			]

			expect(tokenize_input(test_text[0])).toEqual(EXPECTED_OUTPUT)
		})
	})

	test('invalid clause notation', () => {
		const INPUT = "(imp imp) token(imp) (imp)token (implicit_situational) (imperative) (Paul's) (test )"

		const EXPECTED_OUTPUT = [
			create_error_token('(imp', ERRORS.MISSING_CLOSING_PAREN),
			create_error_token('imp)', ERRORS.MISSING_OPENING_PAREN),
			create_pronoun_token('token', create_word_token('imp')),		// tokenizing at this time does not differentiate from a pronoun referent
			create_error_token('(imp)token', ERRORS.INVALID_TOKEN_END('(imp)')),
			create_error_token('(implicit_situational)', ERRORS.UNRECOGNIZED_CLAUSE_NOTATION),
			create_error_token('(imperative)', ERRORS.UNRECOGNIZED_CLAUSE_NOTATION),
			create_error_token("(Paul's)", ERRORS.UNRECOGNIZED_CLAUSE_NOTATION),
			create_error_token('(test', ERRORS.MISSING_CLOSING_PAREN),
			create_error_token(')', ERRORS.MISSING_OPENING_PAREN),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	describe('all valid function words lowercase', () => {
		test.each(Array.from(FUNCTION_WORDS).map(word => [[word]]))('%s', test_text => {
			const [word, tag] = test_text[0]
			const EXPECTED_OUTPUT = [
				create_token(word, TOKEN_TYPE.FUNCTION_WORD, { tag }),
			]

			expect(tokenize_input(word)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('all valid function words uppercase', () => {
		test.each(Array.from(FUNCTION_WORDS).map(([word, tag]) => [[[word.toUpperCase(), tag]]]))('%s', test_text => {
			const [word, tag] = test_text[0]
			const EXPECTED_OUTPUT = [
				create_token(word, TOKEN_TYPE.FUNCTION_WORD, { tag }),
			]

			expect(tokenize_input(word)).toEqual(EXPECTED_OUTPUT)
		})
	})

	test('valid opening brackets', () => {
		const INPUT = '[[ [" "[ [token [. [? [] [[token]]'

		const EXPECTED_OUTPUT = [
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_word_token('token'),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('?', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_word_token('token'),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid opening brackets', () => {
		const INPUT = '.[ ,[ ?[ ][ token[ :['

		const EXPECTED_OUTPUT = [
			create_error_token('.[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
			create_error_token(',[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
			create_error_token('?[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
			create_error_token('][', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
			create_error_token('token[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
			create_error_token(':[', ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid punctuation', () => {
		const INPUT = '." ". ?"] token]". "], token]] token, 5:5'

		const EXPECTED_OUTPUT = [
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('?', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_word_token('token'),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token(',', TOKEN_TYPE.PUNCTUATION),
			create_word_token('token'),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_word_token('token'),
			create_token(',', TOKEN_TYPE.PUNCTUATION),
			create_word_token('5'),
			create_token(':', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: '-ReferenceMarker', tag: { 'syntax': 'verse_ref_colon' } }),
			create_word_token('5'),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('single quote variants', () => {
		const INPUT = "Paul's Paul’s Jesus’ Jesus' sons’-C you(Paul’s)"

		const EXPECTED_OUTPUT = [
			create_word_token('Paul\'s', { lookup_term: 'Paul' }),
			create_word_token('Paul\'s', { lookup_term: 'Paul' }),
			create_word_token('Jesus\'', { lookup_term: 'Jesus' }),
			create_word_token("Jesus'", { lookup_term: 'Jesus' }),
			create_word_token('sons\'-C', { lookup_term: 'sons', sense: 'C' }),
			create_pronoun_token('you', create_word_token('Paul\'s', { lookup_term: 'Paul' })),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('double quote variants', () => {
		const INPUT = '[“Yes.”] " “'

		const EXPECTED_OUTPUT = [
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_word_token('Yes'),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
			create_token('"', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid single characters', () => {
		const INPUT = '( ) / * + ;'

		const EXPECTED_OUTPUT = [
			create_error_token('(', ERRORS.MISSING_CLOSING_PAREN),
			create_error_token(')', ERRORS.MISSING_OPENING_PAREN),
			create_error_token('/', ERRORS.INVALID_PAIRING_SYNTAX),
			create_error_token('*', ERRORS.UNRECOGNIZED_CHAR),
			create_error_token('+', ERRORS.UNRECOGNIZED_CHAR),
			create_error_token(';', ERRORS.UNRECOGNIZED_CHAR),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid pairing', () => {
		const INPUT = "simple/complex simple's/complex's simples'/complexs' simples'-A/complexs' simple-A/complex-B. [simple/complex]"

		const EXPECTED_OUTPUT = [
			create_pairing(create_word_token('simple'), create_word_token('complex')),
			create_pairing(
				create_word_token("simple's", { lookup_term: 'simple' }),
				create_word_token("complex's", { lookup_term: 'complex' }),
			),
			create_pairing(
				create_word_token("simples'", { lookup_term: 'simples' }),
				create_word_token("complexs'", { lookup_term: 'complexs' }),
			),
			create_pairing(
				create_word_token("simples'-A", { lookup_term: 'simples', sense: 'A' }),
				create_word_token("complexs'", { lookup_term: 'complexs' }),
			),
			create_pairing(
				create_word_token('simple-A', { lookup_term: 'simple', sense: 'A' }),
				create_word_token('complex-B', { lookup_term: 'complex', sense: 'B' }),
			),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
			create_token('[', TOKEN_TYPE.PUNCTUATION),
			create_pairing(create_word_token('simple'), create_word_token('complex')),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid pairing', () => {
		const INPUT = '/complex simple/ / simple//complex simple/.complex simple./complex'

		const EXPECTED_OUTPUT = [
			create_error_token('/complex', ERRORS.INVALID_PAIRING_SYNTAX),
			create_error_token('simple/', ERRORS.INVALID_PAIRING_SYNTAX),
			create_error_token('/', ERRORS.INVALID_PAIRING_SYNTAX),
			create_error_token('simple//complex', ERRORS.INVALID_PAIRING_SYNTAX),
			create_error_token('simple/', ERRORS.INVALID_PAIRING_SYNTAX),
			create_error_token('.complex', ERRORS.INVALID_TOKEN_END('.')),
			create_word_token('simple'),
			create_error_token('./complex', ERRORS.INVALID_TOKEN_END('.')),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})
})
