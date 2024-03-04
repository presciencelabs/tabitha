import {TOKEN_TYPE, create_clause_token, create_error_token, create_token, flatten_sentence, token_has_error} from '../parser/token'
import {ERRORS} from '../parser/error_messages'
import {apply_rules} from './rules_processor'
import {SYNTAX_RULES} from './syntax_rules'
import {tokenize_input} from '$lib/parser/tokenize'
import {clausify} from '$lib/parser/clausify'
import {describe, expect, test} from 'vitest'

/**
 *
 * @param {string[]} tokens
 * @returns {Token[]}
 */
function create_tokens(tokens) {
	return tokens.map(token => create_token(token, select_token_type(token)))

	/**
	 * 
	 * @param {string} token 
	 * @returns {TokenType}
	 */
	function select_token_type(token) {
		if (token.length === 1) {
			return TOKEN_TYPE.PUNCTUATION
		}
		if (token[0] === '_' || token[0] === '(') {
			return TOKEN_TYPE.NOTE
		}
		return TOKEN_TYPE.LOOKUP_WORD
	}
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	const clause = create_clause_token(tokens)
	clause.tag = 'main_clause'
	return { clause }
}

/**
 * 
 * @param {string} stem
 * @param {Object} [data={}] 
 * @param {string} [data.sense='A'] 
 * @param {string} [data.part_of_speech='Noun'] 
 * @param {number} [data.level=1] 
 * @returns {OntologyResult}
 */
function create_lookup_result(stem, {sense='A', part_of_speech='Noun', level=1}={}) {
	return {
		id: '0',
		stem: stem,
		sense,
		part_of_speech,
		level,
		gloss: '',
	}
}

/**
 *
 * @param {number} index
 * @param {string} message
 * @param {Token[]} tokens
 */
function expect_error_at(index, message, tokens) {
	for (let [i, token] of tokens.entries()) {
		if (i === index) {
			expect(token_has_error(token)).toBe(true)
			expect(token.message).toEqual(message)
		} else {
			expect(token.message).toBe('')
		}
	}
}

describe('sentence syntax: capitalization', () => {
	describe('valid', () => {
		test('. empty sentence', () => {
			const test_tokens = [create_sentence([])]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('Token token.', () => {
			const test_tokens = [
				create_sentence(create_tokens(['Token', 'token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('Token. Token.', () => {
			const test_tokens = [
				create_sentence(create_tokens(['Token', '.'])),
				create_sentence(create_tokens(['Token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('.5 token. numbers don\'t need to be checked', () => {
			const test_tokens = [
				create_sentence(create_tokens(['.5', 'token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('100 token. numbers don\'t need to be checked', () => {
			const test_tokens = [
				create_sentence(create_tokens(['100', 'token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('_note Token. notes get skipped over', () => {
			const test_tokens = [
				create_sentence(create_tokens(['_note', 'Token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('(imp) Token. notes get skipped over', () => {
			const test_tokens = [
				create_sentence(create_tokens(['(imp)', 'Token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('Token. _note Token.', () => {
			const test_tokens = [
				create_sentence(create_tokens(['Token', '.'])),
				create_sentence(create_tokens(['_note', 'Token', '.'])),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('[Token] token. nested clauses get checked', () => {
			const test_tokens = [
				create_sentence([
					create_clause_token(create_tokens(['[', 'Token', ']'])),
					...create_tokens(['token', '.']),
				]),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('[[Token]] token. nested clauses get checked', () => {
			const test_tokens = [
				create_sentence([
					create_clause_token([
						create_token('[', TOKEN_TYPE.PUNCTUATION),
						create_clause_token(create_tokens(['[', 'Token', ']'])),
						create_token(']', TOKEN_TYPE.PUNCTUATION),
					]),
					...create_tokens(['token', '.']),
				]),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('To token. function words get checked', () => {
			const test_tokens = [
				create_sentence([
					create_token('To', TOKEN_TYPE.FUNCTION_WORD),
					create_token('token', TOKEN_TYPE.LOOKUP_WORD),
					create_token('.', TOKEN_TYPE.PUNCTUATION),
				]),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
		test('Followers/disciples token. pairings get checked', () => {
			const test_tokens = [
				create_sentence([
					create_token('Followers', TOKEN_TYPE.LOOKUP_WORD, {pairing: create_token('disciples', TOKEN_TYPE.LOOKUP_WORD)}),
					create_token('token', TOKEN_TYPE.LOOKUP_WORD),
					create_token('.', TOKEN_TYPE.PUNCTUATION),
				]),
			]
			const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

			expect(result_tokens).toEqual(test_tokens)
		})
	})

	describe('invalid', () => {
		test('token.', () => {
			const test_tokens = [
				create_sentence(create_tokens(['token', '.'])),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(2)
			expect_error_at(0, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('Token. token.', () => {
			const test_tokens = [
				create_sentence(create_tokens(['Token', '.'])),
				create_sentence(create_tokens(['token', '.'])),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(4)
			expect_error_at(2, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('_note token. notes get skipped over', () => {
			const test_tokens = [
				create_sentence(create_tokens(['_note', 'token', '.'])),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(3)
			expect_error_at(1, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('(imp) token. notes get skipped over', () => {
			const test_tokens = [
				create_sentence(create_tokens(['(imp)', 'token', '.'])),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(3)
			expect_error_at(1, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('Token. _note token.', () => {
			const test_tokens = [
				create_sentence(create_tokens(['Token', '.'])),
				create_sentence(create_tokens(['_note', 'token', '.'])),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(5)
			expect_error_at(3, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('[token] token. nested clauses get checked', () => {
			const test_tokens = [
				create_sentence([
					create_clause_token(create_tokens(['[', 'token', ']'])),
					...create_tokens(['token', '.']),
				]),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(5)
			expect_error_at(1, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('[[token]] token. nested clauses get checked', () => {
			const test_tokens = [
				create_sentence([
					create_clause_token([
						create_token('[', TOKEN_TYPE.PUNCTUATION),
						create_clause_token(create_tokens(['[', 'token', ']'])),
						create_token(']', TOKEN_TYPE.PUNCTUATION),
					]),
					...create_tokens(['token', '.']),
				]),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(7)
			expect_error_at(2, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('to. function words get checked', () => {
			const test_tokens = [
				create_sentence([
					create_token('to', TOKEN_TYPE.FUNCTION_WORD),
					create_token('token', TOKEN_TYPE.LOOKUP_WORD),
					create_token('.', TOKEN_TYPE.PUNCTUATION),
				]),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(3)
			expect_error_at(0, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('followers/disciples. pairings get checked', () => {
			const test_tokens = [
				create_sentence([
					create_token('followers', TOKEN_TYPE.LOOKUP_WORD, {pairing: create_token('disciples', TOKEN_TYPE.LOOKUP_WORD)}),
					create_token('token', TOKEN_TYPE.LOOKUP_WORD),
					create_token('.', TOKEN_TYPE.PUNCTUATION),
				]),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(3)
			expect_error_at(0, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
		test('you go. an existing error doesn\'t get overwritten', () => {
			const test_tokens = [
				create_sentence([
					create_error_token('you', 'Some error'),
					create_token('go', TOKEN_TYPE.LOOKUP_WORD),
					create_token('.', TOKEN_TYPE.PUNCTUATION),
				]),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(3)
			expect_error_at(0, 'Some error', checked_tokens)
			expect(checked_tokens[1].message).toBe('')
		})
		test('Token, ["hello"]. beginning of quote is checked', () => {
			const test_tokens = [
				create_sentence([
					create_token('Token', TOKEN_TYPE.LOOKUP_WORD),
					create_token(',', TOKEN_TYPE.PUNCTUATION),
					create_clause_token([
						create_token('[', TOKEN_TYPE.PUNCTUATION),
						create_token('"', TOKEN_TYPE.PUNCTUATION),
						create_token('hello', TOKEN_TYPE.LOOKUP_WORD),
						create_token('"', TOKEN_TYPE.PUNCTUATION),
						create_token(']', TOKEN_TYPE.PUNCTUATION),
					]),
					create_token('.', TOKEN_TYPE.PUNCTUATION),
				]),
			]

			const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).length(8)
			expect_error_at(4, ERRORS.FIRST_WORD_NOT_CAPITALIZED, checked_tokens)
		})
	})
})

describe('sentence syntax: tag setting', () => {
	test('relative clause tag', () => {
		const test_tokens = clausify(tokenize_input('People [who] say [who] person ["who].'))
		test_tokens[0].clause.sub_tokens[0].lookup_results.push(create_lookup_result('person', {part_of_speech: 'Noun'}))
		test_tokens[0].clause.sub_tokens[2].lookup_results.push(create_lookup_result('say', {part_of_speech: 'Verb'}))
		test_tokens[0].clause.sub_tokens[4].lookup_results.push(create_lookup_result('person', {part_of_speech: 'Noun'}))

		const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES)
		const clause_tokens = checked_tokens[0].clause.sub_tokens
		
		expect(clause_tokens[1].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[1].tag).toBe('relative_clause')
		expect(clause_tokens[3].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[3].tag).not.toBe('relative_clause')
		expect(clause_tokens[5].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[5].tag).not.toBe('relative_clause')
	})
	test('"that" clause tag', () => {
		const test_tokens = clausify(tokenize_input('That person [that]. John saw [that].'))
		test_tokens[0].clause.sub_tokens[1].lookup_results.push(create_lookup_result('person', {part_of_speech: 'Noun'}))
		test_tokens[1].clause.sub_tokens[1].lookup_results.push(create_lookup_result('see', {part_of_speech: 'Verb'}))

		const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES)
		
		expect(checked_tokens[0].clause.sub_tokens[2].tag).toBe('relative_clause|patient_clause')
		expect(checked_tokens[0].clause.sub_tokens[2].sub_tokens[1].tag).toBe('relativizer|complementizer')
		
		expect(checked_tokens[1].clause.sub_tokens[2].tag).toBe('patient_clause')
		expect(checked_tokens[1].clause.sub_tokens[2].sub_tokens[1].tag).toBe('complementizer')
	})
	test('Adverbial clause tag', () => {
		const test_tokens = clausify(tokenize_input('[Because].'))
		test_tokens[0].clause.sub_tokens[0].sub_tokens[1].lookup_results.push(create_lookup_result('because', {part_of_speech: 'Adposition'}))

		const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES)
		const clause_tokens = checked_tokens[0].clause.sub_tokens
		
		expect(clause_tokens[0].tag).toBe('adverbial_clause')
	})
})
