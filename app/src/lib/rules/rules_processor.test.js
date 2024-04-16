import { TOKEN_TYPE, create_clause_token, create_lookup_result, create_token, flatten_sentence } from '$lib/parser/token'
import { describe, expect, test } from 'vitest'
import { apply_rules } from './rules_processor'
import { LOOKUP_RULES } from './lookup_rules'
import { parse_transform_rule } from './transform_rules'
import { parse_checker_rule } from './checker_rules'
import { parse_part_of_speech_rule } from './part_of_speech_rules'
import { expect_error } from '$lib/test_helps'

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens, { 'clause_type': 'main_clause' }) }
}

/**
 * 
 * @param {string} token 
 * @param {Object} [data={}] 
 * @param {LookupResult[]} [data.lookup_results=[]] 
 * @returns {Token}
 */
function create_lookup_token(token, { lookup_results=[] }={}) {
	const lookup_token = create_token(token, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: token })
	lookup_token.lookup_results = lookup_results
	return lookup_token
}

/**
 * 
 * @param {string} stem
 * @param {Object} [data={}] 
 * @param {string} [data.sense='A'] 
 * @param {string} [data.part_of_speech='Noun'] 
 * @param {number} [data.level=1] 
 * @returns {LookupResult}
 */
function lookup_w_concept(stem, { sense='A', part_of_speech='Noun', level=1 }={}) {
	const concept = {
		id: '0',
		stem,
		sense,
		part_of_speech,
		level,
		gloss: '',
		categorization: '',
	}
	return create_lookup_result({ stem, part_of_speech }, { concept })
}

describe('transform rules', () => {
	test('trigger does not match', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': 'all' },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
				create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
			]),
		]

		const results = apply_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})

	test('triggered but context does not match', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'other' } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			]),
		]

		const results = apply_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})

	test('triggered and transformed', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'peanut' },
				'context': { 'precededby': { 'token': 'a' } },
				'transform': { 'tag': { 'key': 'value' } },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('John\'s', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'John' }),
				create_token('peanut', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'peanut' }),
				create_token('was', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'was' }),
				create_token('a', TOKEN_TYPE.FUNCTION_WORD),
				create_token('peanut', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'peanut' }),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]),
		]

		const results = apply_rules(input_tokens, transform_rules).flatMap(flatten_sentence)

		expect(results.length).toBe(6)
		expect(results[1].tag).toEqual({})
		expect(results[4].tag).toEqual({ 'key': 'value' })
	})

	test('triggered within a subordinate clauses', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'transform': { 'tag': { 'key': 'value' } },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_clause_token([
					create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
				]),
			]),
		]

		const results = apply_rules(input_tokens, transform_rules).flatMap(flatten_sentence)

		expect(results[0].tag).toEqual({ 'key': 'value' })
	})

	test('concept selected is brought to top of results', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'saw' },
				'context': { 'followedby': 'all' },
				'transform': { 'concept': 'see-C' },
			},
		].map(parse_transform_rule)

		const tokens = [
			create_sentence([
				create_token('John', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'John' }),
				create_token('saw', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'see' }),
				create_token('the', TOKEN_TYPE.FUNCTION_WORD),
				create_token('cat', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'cat' }),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]),
		]
		tokens[0].clause.sub_tokens[1].lookup_results = [
			lookup_w_concept('see', { sense: 'A' }),
			lookup_w_concept('see', { sense: 'B' }),
			lookup_w_concept('see', { sense: 'C' }),
		]

		const results = apply_rules(tokens, transform_rules).flatMap(flatten_sentence)

		expect(results[1].lookup_results[0].concept?.stem).toBe('see')
		expect(results[1].lookup_results[0].concept?.sense).toBe('C')
		expect(results[1].lookup_results.length).toBe(3)
	})

	test('not triggered across sentences', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'other', 'skip': 'all'  } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			]),
			create_sentence([
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
			]),
		]

		const results = apply_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})

	test('not triggered when context is in subordinate clauses', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context', 'skip': 'all' } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_clause_token([
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
				]),
			]),
		]

		const results = apply_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})
})

describe('checker rules', () => {
	test('trigger does not match', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('not_token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'not_token' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})
	test('triggered but context does not match', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})
	test('triggered with require followedby', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(3)
		expect(output_tokens[0].messages.length).toBe(0)
		expect(output_tokens[1].token).toBe('add')
		expect_error(output_tokens[1], 'message')
		expect(output_tokens[2].messages.length).toBe(0)
	})
	test('triggered with require precededby', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'precededby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(3)
		expect(output_tokens[0].token).toBe('add')
		expect_error(output_tokens[0], 'message')
		expect(output_tokens[1].messages.length).toBe(0)
		expect(output_tokens[2].messages.length).toBe(0)
	})
	test('triggered with multiple precededby', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'precededby': 'add1',
					'message': 'message1',
				},
			},
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'precededby': 'add2',
					'message': 'message2',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(4)
		expect(output_tokens[0].token).toBe('add1')
		expect_error(output_tokens[0], 'message1')
		expect(output_tokens[1].token).toBe('add2')
		expect_error(output_tokens[1], 'message2')
		expect(output_tokens[2].messages.length).toBe(0)
		expect(output_tokens[3].messages.length).toBe(0)
	})
	test('triggered with message on trigger', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': { 'message': 'message' },
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(2)
		expect(output_tokens[0].token).toBe('token')
		expect_error(output_tokens[0], 'message')
		expect(output_tokens[1].messages.length).toBe(0)
	})
	test('not triggered across sentences', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context', 'skip': 'all' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			]),
			create_sentence([
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})
	test('context not triggered from within subordinate clauses', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context', 'skip': 'all' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
				create_clause_token([
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
				]),
			]),
		]

		const output_tokens = apply_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})

	test('triggered within a subordinate clauses', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_clause_token([
					create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'context' }),
				]),
			]),
		]

		const results = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(results.length).toBe(3)
		expect(results[1].token).toBe('add')
		expect_error(results[1], 'message')
	})
})

describe('lookup rules', () => {
	test('built-in lookup rules', () => {
		const input_tokens = [
			create_sentence([
				create_token('John', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'John' }),
				create_token('ran', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'run' }),
				create_clause_token([
					create_token('[', TOKEN_TYPE.PUNCTUATION),
					create_token('in', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'in' }),
					create_token('order', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'order' }),
					create_token('to', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'to' }),
					create_token('take', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'take' }),
					create_token('many', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'many' }),
					create_token('books', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'book' }),
					create_token('away', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'away' }),
					create_token(']', TOKEN_TYPE.PUNCTUATION),
				]),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]),
		]
		const results = apply_rules(input_tokens, LOOKUP_RULES).flatMap(flatten_sentence)

		expect(results[0].token).toBe('John')
		expect(results[0].messages.length).toBe(0)
		expect(results[1].token).toBe('ran')
		expect(results[1].messages.length).toBe(0)
		expect(results[2].token).toBe('[')
		expect(results[2].messages.length).toBe(0)
		expect(results[3].token).toBe('in order to')
		expect(results[3].lookup_terms[0]).toBe('in-order-to')
		expect(results[3].messages.length).toBe(0)
		expect(results[4].token).toBe('take')
		expect(results[4].messages.length).toBe(0)
		expect(results[5].token).toBe('many')
		expect(results[5].lookup_terms[0]).toBe('much-many')
		expect(results[5].messages.length).toBe(0)
		expect(results[6].token).toBe('books')
		expect(results[6].messages.length).toBe(0)
		expect(results[7].token).toBe('away')
		expect(results[7].messages.length).toBe(0)
		expect(results[8].token).toBe(']')
		expect(results[8].messages.length).toBe(0)
		expect(results[9].token).toBe('.')
		expect(results[9].messages.length).toBe(0)
		expect(results).length(10)
	})
})

describe('part-of-speech rules', () => {
	test('word does not match any parts of speech', () => {
		const rules = [
			{
				'category': 'Noun|Verb',
				'context': {},
				'remove': 'Noun',
			},
		].map(parse_part_of_speech_rule)

		const input_tokens = [
			create_sentence([
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token', { part_of_speech: 'Adjective' }),
				] }),
			]),
		]

		const results = apply_rules(input_tokens, rules)

		expect(results).toEqual(input_tokens)
	})
	test('word matches only one part of speech', () => {
		const rules = [
			{
				'category': 'Noun|Verb',
				'context': {},
				'remove': 'Noun',
			},
		].map(parse_part_of_speech_rule)

		const input_tokens = [
			create_sentence([
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token1', { part_of_speech: 'Noun' }),
					lookup_w_concept('token2', { part_of_speech: 'Noun' }),
				] }),
			]),
		]

		const results = apply_rules(input_tokens, rules)

		expect(results).toEqual(input_tokens)
	})
	test('word matches both parts of speech', () => {
		const rules = [
			{
				'category': 'Noun|Verb',
				'context': {},
				'remove': 'Noun',
			},
		].map(parse_part_of_speech_rule)

		const input_tokens = [
			create_sentence([
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token1', { part_of_speech: 'Noun' }),
					lookup_w_concept('token2', { part_of_speech: 'Noun' }),
					lookup_w_concept('token1', { part_of_speech: 'Verb' }),
					lookup_w_concept('token2', { part_of_speech: 'Verb' }),
				] }),
			]),
		]

		const results = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(results[0].messages.length).toBe(0)
		expect(results[0].lookup_results.length).toBe(2)
		expect(results[0].lookup_results[0].part_of_speech).toBe('Verb')
	})
	test('word matches both parts of speech, but has three', () => {
		const rules = [
			{
				'category': 'Noun|Verb',
				'context': {},
				'remove': 'Noun',
			},
		].map(parse_part_of_speech_rule)

		const input_tokens = [
			create_sentence([
				create_lookup_token('token', { lookup_results: [
					lookup_w_concept('token1', { part_of_speech: 'Noun' }),
					lookup_w_concept('token2', { part_of_speech: 'Noun' }),
					lookup_w_concept('token1', { part_of_speech: 'Verb' }),
					lookup_w_concept('token2', { part_of_speech: 'Verb' }),
					lookup_w_concept('token1', { part_of_speech: 'Adjective' }),
				] }),
			]),
		]

		const results = apply_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(results[0].messages.length).toBe(0)
		expect(results[0].lookup_results.length).toBe(3)
		expect(results[0].lookup_results[0].part_of_speech).toBe('Verb')
		expect(results[0].lookup_results[1].part_of_speech).toBe('Verb')
		expect(results[0].lookup_results[2].part_of_speech).toBe('Adjective')
	})
})