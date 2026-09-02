import { describe, expect, test } from 'vitest'
import { CLAUSE_NOTATIONS } from './clause_notations'
import { ERRORS } from './error_messages'
import { FUNCTION_WORDS } from './function_words'
import { MESSAGE_TYPE, TOKEN_TYPE, create_token } from '../token'
import { tokenize_input } from './tokenize'
import type { PairingType } from '@tabitha/types'
import type { Token } from '$lib/types'

function create_word_token(token: string, { lookup_term = null, sense = '' }: { lookup_term?: string | null; sense?: string } = {}): Token {
	return create_token({ token, type: TOKEN_TYPE.LOOKUP_WORD, lookup_term: lookup_term || token, specified_sense: sense })
}

function create_pairing(left_token: Token, right_token: Token, pairing_type: PairingType): Token {
	left_token.pairing = right_token
	left_token.pairing_type = pairing_type
	return left_token
}

function create_pronoun_token(pronoun: string, referent_token: Token): Token {
	const pronoun_token = create_token({ token: pronoun, type: TOKEN_TYPE.FUNCTION_WORD })
	referent_token.pronoun = pronoun_token
	return referent_token
}

function create_error_token(token: string, message: string): Token {
	return create_token({ token, type: TOKEN_TYPE.NOTE, message: { ...MESSAGE_TYPE.ERROR, message, rule_id: 'token:syntax' } })
}

describe('tokenize_input', () => {
	test("'' should return an empty array", () => {
		const INPUT = ''

		const EXPECTED_OUTPUT: Token[] = []

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
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('3.88', { lookup_term: '3.88' }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
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
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_pronoun_token('you', create_word_token('Paul')),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
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
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid underscore notation', () => {
		const INPUT = '_note _note. _note] [_note _note[ __implicit'

		const EXPECTED_OUTPUT = [
			create_token({ token: '_note', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '_note', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '_note', type: TOKEN_TYPE.NOTE }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '_note', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '_note', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '__implicit', type: TOKEN_TYPE.NOTE }), 	// double underscore is fine
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
			create_token({ token: '(imp)', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '(implicit-situational)', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '(imp)', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '(imp)', type: TOKEN_TYPE.NOTE }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '(imp)', type: TOKEN_TYPE.NOTE }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	describe('all valid clause notations', () => {
		test.each(CLAUSE_NOTATIONS.map(notation => [[notation]]))('%s', test_text => {
			const EXPECTED_OUTPUT = [
				create_token({ token: test_text[0], type: TOKEN_TYPE.NOTE }),
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
		test.each(Array.from(FUNCTION_WORDS))('%s', (word, tag) => {
			const EXPECTED_OUTPUT = [
				create_token({ token: word, type: TOKEN_TYPE.FUNCTION_WORD, tag }),
			]

			expect(tokenize_input(word)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('all valid function words uppercase', () => {
		test.each(Array.from(FUNCTION_WORDS))('%s', (word, tag) => {
			const upper_word = word.toUpperCase()
			const EXPECTED_OUTPUT = [
				create_token({ token: upper_word, type: TOKEN_TYPE.FUNCTION_WORD, tag }),
			]

			expect(tokenize_input(upper_word)).toEqual(EXPECTED_OUTPUT)
		})
	})

	test('valid opening brackets', () => {
		const INPUT = '[[ [" "[ [token [. [? [] [[token]]'

		const EXPECTED_OUTPUT = [
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('token'),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '?', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('token'),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
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
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '?', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('token'),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ',', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('token'),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('token'),
			create_token({ token: ',', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('5'),
			create_token({ token: ':', type: TOKEN_TYPE.LOOKUP_WORD, lookup_term: '-ReferenceMarker', tag: { 'syntax': 'verse_ref_colon' } }),
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
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_word_token('Yes'),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '"', type: TOKEN_TYPE.PUNCTUATION }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid single characters', () => {
		const INPUT = '( ) / * + ;'

		const EXPECTED_OUTPUT = [
			create_error_token('(', ERRORS.MISSING_CLOSING_PAREN),
			create_error_token(')', ERRORS.MISSING_OPENING_PAREN),
			create_error_token('/', ERRORS.INVALID_COMPLEX_PAIRING_SYNTAX),
			create_error_token('*', ERRORS.UNRECOGNIZED_CHAR),
			create_error_token('+', ERRORS.UNRECOGNIZED_CHAR),
			create_error_token(';', ERRORS.UNRECOGNIZED_CHAR),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid complex pairing', () => {
		const INPUT = "simple/complex simple's/complex's simples'/complexs' simples'-A/complexs' simple-A/complex-B. [simple/complex]"

		const EXPECTED_OUTPUT = [
			create_pairing(create_word_token('simple'), create_word_token('complex'), 'simple-complex'),
			create_pairing(
				create_word_token("simple's", { lookup_term: 'simple' }),
				create_word_token("complex's", { lookup_term: 'complex' }),
				'simple-complex',
			),
			create_pairing(
				create_word_token("simples'", { lookup_term: 'simples' }),
				create_word_token("complexs'", { lookup_term: 'complexs' }),
				'simple-complex',
			),
			create_pairing(
				create_word_token("simples'-A", { lookup_term: 'simples', sense: 'A' }),
				create_word_token("complexs'", { lookup_term: 'complexs' }),
				'simple-complex',
			),
			create_pairing(
				create_word_token('simple-A', { lookup_term: 'simple', sense: 'A' }),
				create_word_token('complex-B', { lookup_term: 'complex', sense: 'B' }),
				'simple-complex',
			),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_pairing(create_word_token('simple'), create_word_token('complex'), 'simple-complex'),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid complex pairing', () => {
		const INPUT = '/complex simple/ / simple//complex simple/.complex simple./complex'

		const EXPECTED_OUTPUT = [
			create_error_token('/complex', ERRORS.INVALID_COMPLEX_PAIRING_SYNTAX),
			create_error_token('simple/', ERRORS.INVALID_COMPLEX_PAIRING_SYNTAX),
			create_error_token('/', ERRORS.INVALID_COMPLEX_PAIRING_SYNTAX),
			create_error_token('simple//complex', ERRORS.INVALID_COMPLEX_PAIRING_SYNTAX),
			create_error_token('simple/', ERRORS.INVALID_COMPLEX_PAIRING_SYNTAX),
			create_error_token('.complex', ERRORS.INVALID_TOKEN_END('.')),
			create_word_token('simple'),
			create_error_token('./complex', ERRORS.INVALID_TOKEN_END('.')),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid literal pairing', () => {
		const INPUT = "dynamic|literal dynamic's|literal's dynamics'|literals' dynamics'-A|literals' dynamic-A|literal-B. [dynamic|literal]"

		const EXPECTED_OUTPUT = [
			create_pairing(create_word_token('dynamic'), create_word_token('literal'), 'dynamic-literal'),
			create_pairing(
				create_word_token("dynamic's", { lookup_term: 'dynamic' }),
				create_word_token("literal's", { lookup_term: 'literal' }),
				'dynamic-literal',
			),
			create_pairing(
				create_word_token("dynamics'", { lookup_term: 'dynamics' }),
				create_word_token("literals'", { lookup_term: 'literals' }),
				'dynamic-literal',
			),
			create_pairing(
				create_word_token("dynamics'-A", { lookup_term: 'dynamics', sense: 'A' }),
				create_word_token("literals'", { lookup_term: 'literals' }),
				'dynamic-literal',
			),
			create_pairing(
				create_word_token('dynamic-A', { lookup_term: 'dynamic', sense: 'A' }),
				create_word_token('literal-B', { lookup_term: 'literal', sense: 'B' }),
				'dynamic-literal',
			),
			create_token({ token: '.', type: TOKEN_TYPE.PUNCTUATION }),
			create_token({ token: '[', type: TOKEN_TYPE.PUNCTUATION }),
			create_pairing(create_word_token('dynamic'), create_word_token('literal'), 'dynamic-literal'),
			create_token({ token: ']', type: TOKEN_TYPE.PUNCTUATION }),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid literal pairing', () => {
		const INPUT = '|literal dynamic| | dynamic||literal dynamic|.literal dynamic.|literal'

		const EXPECTED_OUTPUT = [
			create_error_token('|literal', ERRORS.INVALID_LITERAL_PAIRING_SYNTAX),
			create_error_token('dynamic|', ERRORS.INVALID_LITERAL_PAIRING_SYNTAX),
			create_error_token('|', ERRORS.INVALID_LITERAL_PAIRING_SYNTAX),
			create_error_token('dynamic||literal', ERRORS.INVALID_LITERAL_PAIRING_SYNTAX),
			create_error_token('dynamic|', ERRORS.INVALID_LITERAL_PAIRING_SYNTAX),
			create_error_token('.literal', ERRORS.INVALID_TOKEN_END('.')),
			create_word_token('dynamic'),
			create_error_token('.|literal', ERRORS.INVALID_TOKEN_END('.')),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})
})
