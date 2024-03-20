import { TOKEN_TYPE, create_clause_token, create_token, flatten_sentence } from '../parser/token'
import { apply_rules } from './rules_processor'
import { SYNTAX_RULES } from './syntax_rules'
import { tokenize_input } from '$lib/parser/tokenize'
import { clausify } from '$lib/parser/clausify'
import { describe, expect, test } from 'vitest'
import { ERRORS } from '$lib/parser/error_messages'


describe('sentence syntax: tag setting', () => {
	test('quote_begin clause tag', () => {
		const test_tokens = clausify(tokenize_input('People [] say [] person ["].'))

		const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES)
		const clause_tokens = checked_tokens[0].clause.sub_tokens
		
		expect(clause_tokens[1].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[1].tag).toBe('subordinate_clause')
		expect(clause_tokens[3].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[3].tag).toBe('subordinate_clause')
		expect(clause_tokens[5].type).toBe(TOKEN_TYPE.CLAUSE)
		expect(clause_tokens[5].tag).toBe('patient_clause|quote_begin')
	})
})

describe('sentence syntax: first_word detection', () => {
	test('. empty sentence', () => {
		const test_tokens = clausify(tokenize_input('.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES)

		expect(result_tokens).toEqual(test_tokens)
	})
	test('Token token.', () => {
		const test_tokens = clausify(tokenize_input('Token token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toBe('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
	})
	test('Token. Token.', () => {
		const test_tokens = clausify(tokenize_input('Token. Token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toBe('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).toBe('first_word')
		expect(result_tokens[3].tag).not.toBe('first_word')
	})
	test('.5 token. 100 token. numbers count as a word', () => {
		const test_tokens = clausify(tokenize_input('.5 token. 100 token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toBe('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
		expect(result_tokens[3].tag).toBe('first_word')
		expect(result_tokens[4].tag).not.toBe('first_word')
		expect(result_tokens[5].tag).not.toBe('first_word')
	})
	test('_note Token. (imp) Token. notes get skipped over', () => {
		const test_tokens = clausify(tokenize_input('_note Token. (imp) Token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).not.toBe('first_word')
		expect(result_tokens[1].tag).toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
		expect(result_tokens[3].tag).not.toBe('first_word')
		expect(result_tokens[4].tag).toBe('first_word')
		expect(result_tokens[5].tag).not.toBe('first_word')
	})
	test('[Token] token. first word in nested clause', () => {
		const test_tokens = clausify(tokenize_input('[Token] token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).not.toBe('first_word')
		expect(result_tokens[1].tag).toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
		expect(result_tokens[3].tag).not.toBe('first_word')
		expect(result_tokens[4].tag).not.toBe('first_word')
	})
	test('[[Token]] token. first word in double nested clause', () => {
		const test_tokens = clausify(tokenize_input('[[Token]] token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).not.toBe('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).toBe('first_word')
		expect(result_tokens[3].tag).not.toBe('first_word')
		expect(result_tokens[4].tag).not.toBe('first_word')
		expect(result_tokens[5].tag).not.toBe('first_word')
		expect(result_tokens[6].tag).not.toBe('first_word')
	})
	test('A token. function words get tagged', () => {
		const test_tokens = clausify(tokenize_input('A token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toContain('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
	})
	test('Followers/disciples token. pairings get tagged', () => {
		const test_tokens = clausify(tokenize_input('Followers/disciples token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toBe('first_word')
		expect(result_tokens[0].complex_pairing?.tag).not.toBe('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
	})
	test('You(token) token. pronoun referents get tagged', () => {
		const test_tokens = clausify(tokenize_input('You(token) token.'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toContain('first_word')
		expect(result_tokens[0].pronoun?.tag).not.toBe('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
	})
	test('Token [token] ["Token"]. words in quote clauses get tagged, but not other subordinate clauses', () => {
		const test_tokens = clausify(tokenize_input('Token [token] ["Token"].'))
		const result_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(result_tokens[0].tag).toContain('first_word')
		expect(result_tokens[1].tag).not.toBe('first_word')
		expect(result_tokens[2].tag).not.toBe('first_word')
		expect(result_tokens[3].tag).not.toBe('first_word')
		expect(result_tokens[4].tag).not.toBe('first_word')
		expect(result_tokens[5].tag).not.toBe('first_word')
		expect(result_tokens[6].tag).toContain('first_word')
		expect(result_tokens[7].tag).not.toBe('first_word')
		expect(result_tokens[8].tag).not.toBe('first_word')
		expect(result_tokens[9].tag).not.toBe('first_word')
	})
})

/**
 * 
 * @param {Token} left 
 * @param {Token} right 
 * @returns {Token}
 */
function create_pairing_token(left, right) {
	left.complex_pairing = right
	return left
}

/**
 * 
 * @param {string} token 
 * @param {Object} [data={}] 
 * @param {LookupResult[]} [data.lookup_results=[]] 
 * @param {string} [data.tag=''] 
 * @returns {Token}
 */
function create_lookup_token(token, { lookup_results=[], tag='' }={}) {
	const lookup_token = create_token(token, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: token, tag })
	lookup_token.lookup_results = lookup_results
	return lookup_token
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens, 'main_clause') }
}

describe('sentence syntax: capitalization', () => {
	test('valid', () => {
		const test_tokens = [create_sentence([
			create_lookup_token('Token', { tag: 'first_word' }),
			create_pairing_token(
				create_lookup_token('First', { tag: 'first_word' }),
				create_lookup_token('second'),
			),
			create_token('Function', TOKEN_TYPE.FUNCTION_WORD, { tag: 'first_word' }),
			create_token('name', TOKEN_TYPE.LOOKUP_WORD, { tag: 'first_word', pronoun: create_token('You', TOKEN_TYPE.FUNCTION_WORD) }),
		])]

		const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES)

		expect(checked_tokens).toEqual(test_tokens)
	})

	test('invalid', () => {
		const test_tokens = [create_sentence([
			create_lookup_token('token', { tag: 'first_word' }),
			create_pairing_token(
				create_lookup_token('first', { tag: 'first_word' }),
				create_lookup_token('second'),
			),
			create_token('function', TOKEN_TYPE.FUNCTION_WORD, { tag: 'first_word' }),
			create_token('name', TOKEN_TYPE.LOOKUP_WORD, { tag: 'first_word', pronoun: create_token('you', TOKEN_TYPE.FUNCTION_WORD) }),
		])]

		const checked_tokens = apply_rules(test_tokens, SYNTAX_RULES).flatMap(flatten_sentence)

		expect(checked_tokens[0].error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
		expect(checked_tokens[1].error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
		expect(checked_tokens[2].error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
		expect(checked_tokens[3].pronoun?.error_message).toBe(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
	})
})