import { describe, expect, test } from 'vitest'
import { TOKEN_TYPE, create_token, create_lookup_result } from '../parser/token'
import { create_context_filter, create_token_filter, create_token_transform } from './rules_parser'

describe('token filters', () => {
	test('all', () => {
		const filter_json = 'all'
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
		]
		const results = tokens.map(token => filter(token))
		expect(results.every(result => result)).toBe(true)
	})
	test('by token', () => {
		const filter_json = { 'token': 'text' }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text-A' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(true)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(false)
		expect(results[3]).toBe(false)
	})
	test('by multiple tokens', () => {
		const filter_json = { 'token': 'text|other' }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(true)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(false)
	})
	test('by tag key', () => {
		const filter_json = { 'tag': 'key1|key2'  }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: {} }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': '' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key2': '' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key2': 'value', 'other_key': 'value' } }),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(false)
		expect(results[2]).toBe(false)
		expect(results[3]).toBe(true)
		expect(results[4]).toBe(false)
		expect(results[5]).toBe(true)
	})
	test('by tag value', () => {
		const filter_json = { 'tag': { 'key': 'tag1|tag2' } }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: {} }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'other_key': 'tag1' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key': 'tag1' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key': 'tag2' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key': 'tag3' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key': 'tag2|tag3' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key': 'tag4|tag4' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key': 'tag1', 'other_key': 'tag1' } }),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(false)
		expect(results[2]).toBe(true)
		expect(results[3]).toBe(true)
		expect(results[4]).toBe(false)
		expect(results[5]).toBe(true)
		expect(results[6]).toBe(false)
		expect(results[7]).toBe(true)
	})
	test('by multiple tag values', () => {
		const filter_json = { 'tag': { 'key1': 'value1', 'key2': 'value2' } }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: {} }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'not_value', 'key2': 'value2' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value1', 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value1', 'key2': 'value2', 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value1|value3', 'key2': 'value4|value2' } }),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(false)
		expect(results[2]).toBe(false)
		expect(results[3]).toBe(false)
		expect(results[4]).toBe(true)
		expect(results[5]).toBe(true)
	})
	test('by multiple tag options', () => {
		const filter_json = { 'tag': [{ 'key1': 'value1' }, { 'key2': 'value2' }] }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: {} }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'not_value', 'key2': 'value2' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value1', 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value1', 'key2': 'value2', 'other_key': 'value' } }),
			create_token('token', TOKEN_TYPE.FUNCTION_WORD, { tag: { 'key1': 'value1|value3', 'key2': 'value4|value2' } }),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(false)
		expect(results[2]).toBe(true)
		expect(results[3]).toBe(true)
		expect(results[4]).toBe(true)
		expect(results[5]).toBe(true)
	})
})

describe('context filters', () => {
	test('empty filter results in true', () => {
		const context_json = { }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results.every(result => result.success)).toBe(true)
	})
	test('invalid filter results in true', () => {
		const context_json = { 'followedby': 'invalid' }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results.some(result => result.success)).toBe(true)
	})
	test('empty filter results in true', () => {
		const context_json = { 'followedby': { } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results.some(result => result.success)).toBe(true)
	})
	test('followed by', () => {
		const context_json = { 'followedby': { 'token': 'other' } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(true)
		expect(results[1].context_indexes[0]).toBe(2)
		expect(results[2].success).toBe(false)
	})
	test('not followed by', () => {
		const context_json = { 'notfollowedby': { 'token': 'token' } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(true)
		expect(results[1].success).toBe(false)
		expect(results[2].success).toBe(true)
		expect(results[3].success).toBe(true)
	})
	test('followed by with skip', () => {
		const context_json = { 'followedby': { 'token': 'other', 'skip': { 'token': 'skip' } } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'last' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(true)
		expect(results[0].context_indexes[0]).toBe(2)
		expect(results[1].success).toBe(true)
		expect(results[1].context_indexes[0]).toBe(2)
		expect(results[2].success).toBe(false)
		expect(results[3].success).toBe(false)
	})
	test('followed by with multiple skips', () => {
		const context_json = { 'followedby': { 'token': 'other', 'skip': [{ 'token': 'skip' }, { 'tag': { 'skip': 'skip' } }] } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('notskip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'notskip', tag:  { 'skip': 'skip' } }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'last' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(true)
		expect(results[0].context_indexes[0]).toBe(3)
		expect(results[1].success).toBe(true)
		expect(results[1].context_indexes[0]).toBe(3)
		expect(results[2].success).toBe(true)
		expect(results[2].context_indexes[0]).toBe(3)
		expect(results[3].success).toBe(false)
		expect(results[4].success).toBe(false)
	})
	test('preceded by', () => {
		const context_json = { 'precededby': { 'token': 'token' } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(true)
		expect(results[1].context_indexes[0]).toBe(0)
		expect(results[2].success).toBe(false)
		expect(results[3].success).toBe(true)
		expect(results[3].context_indexes[0]).toBe(2)
	})
	test('not preceded by', () => {
		const context_json = { 'notprecededby': { 'token': 'token' } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(true)
		expect(results[1].success).toBe(false)
		expect(results[2].success).toBe(true)
		expect(results[3].success).toBe(false)
	})
	test('preceded by with skip', () => {
		const context_json = { 'precededby': { 'token': 'token', 'skip': { 'token': 'skip' } } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'last' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(true)
		expect(results[1].context_indexes[0]).toBe(0)
		expect(results[2].success).toBe(true)
		expect(results[2].context_indexes[0]).toBe(1)
		expect(results[3].success).toBe(true)
		expect(results[3].context_indexes[0]).toBe(1)
		expect(results[4].success).toBe(false)
	})
	test('preceded by and followed by', () => {
		const context_json = { 'precededby': { 'token': 'token' }, 'followedby': { 'token': 'token' } }
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('middle', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'middle' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'other' }),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'last' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(false)
		expect(results[2].success).toBe(true)
		expect(results[2].context_indexes[0]).toBe(1)
		expect(results[2].context_indexes[1]).toBe(3)
		expect(results[3].success).toBe(false)
		expect(results[4].success).toBe(false)
		expect(results[5].success).toBe(false)
	})
	test('preceded by and followed by with skip', () => {
		const context_json = {
			'precededby': {
				'token': 'token',
				'skip': { 'token': 'skip|middle' },
			},
			'followedby': {
				'token': 'token',
				'skip': { 'token': 'skip|middle' },
			},
		}
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('middle', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'middle' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(false)
		expect(results[2].success).toBe(true)
		expect(results[2].context_indexes[0]).toBe(1)
		expect(results[2].context_indexes[1]).toBe(5)
		expect(results[3].success).toBe(true)
		expect(results[3].context_indexes[0]).toBe(1)
		expect(results[3].context_indexes[1]).toBe(5)
		expect(results[4].success).toBe(true)
		expect(results[4].context_indexes[0]).toBe(1)
		expect(results[4].context_indexes[1]).toBe(5)
		expect(results[5].success).toBe(false)
		expect(results[6].success).toBe(false)
	})
	test('precededby array', () => {
		const context_json = {
			'precededby': [
				{
					'token': 'token',
					'skip': { 'token': 'skip' },
				},
				{
					'token': 'middle',
					'skip': { 'token': 'skip' },
				},
			],
		}
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('middle', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'middle' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(false)
		expect(results[2].success).toBe(false)
		expect(results[3].success).toBe(false)
		expect(results[4].success).toBe(true)
		expect(results[4].context_indexes[0]).toBe(1)
		expect(results[4].context_indexes[1]).toBe(3)
		expect(results[5].success).toBe(true)
		expect(results[5].context_indexes[0]).toBe(1)
		expect(results[5].context_indexes[1]).toBe(3)
		expect(results[6].success).toBe(false)
	})
	test('followedby array', () => {
		const context_json = {
			'followedby': [
				{
					'token': 'middle',
					'skip': { 'token': 'skip' },
				},
				{
					'token': 'token',
					'skip': { 'token': 'skip' },
				},
			],
		}
		const filter = create_context_filter(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('middle', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'middle' }),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'skip' }),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' }),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'text' }),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0].success).toBe(false)
		expect(results[1].success).toBe(true)
		expect(results[1].context_indexes[0]).toBe(3)
		expect(results[1].context_indexes[1]).toBe(5)
		expect(results[2].success).toBe(true)
		expect(results[2].context_indexes[0]).toBe(3)
		expect(results[2].context_indexes[1]).toBe(5)
		expect(results[3].success).toBe(false)
		expect(results[4].success).toBe(false)
		expect(results[5].success).toBe(false)
		expect(results[6].success).toBe(false)
	})
})

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

describe('token transforms', () => {
	test('type', () => {
		const transform_json = { 'type': TOKEN_TYPE.FUNCTION_WORD }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' })
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
		expect(result.lookup_terms).toEqual(token.lookup_terms)
		expect(result.messages).toEqual(token.messages)
	})
	test('concept no lookup results', () => {
		const transform_json = { 'concept': 'concept-A' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' })
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(token.type)
		expect(result.lookup_terms[0]).toBe('token')
		expect(result.lookup_results.length).toBe(0)
		expect(result.messages).toEqual(token.messages)
	})
	test('concept with lookup results', () => {
		const transform_json = { 'concept': 'concept-B' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' })
		token.lookup_results = [
			lookup_w_concept('concept', { 'sense': 'A', 'part_of_speech': 'Noun' }),
			lookup_w_concept('concept', { 'sense': 'B', 'part_of_speech': 'Noun' }),
		]

		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(token.type)
		expect(result.lookup_terms.length).toBe(1)
		expect(result.lookup_results.length).toBe(2)
		expect(result.lookup_results[0].concept?.sense).toBe('B')
		expect(result.messages).toEqual(token.messages)
	})
	test('tag with existing tag on token', () => {
		const transform_json = { 'type': TOKEN_TYPE.FUNCTION_WORD, 'tag': { 'key': 'value' } }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, { tag: { 'old_key': 'old_value' } })
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
		expect(result.tag).toEqual({ 'key': 'value', 'old_key': 'old_value' })
		expect(result.messages).toEqual(token.messages)
	})
	test('tag gets overwritten', () => {
		const transform_json = { 'type': TOKEN_TYPE.FUNCTION_WORD, 'tag': { 'key': 'value' } }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, { tag: { 'key': 'old_value' } })
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
		expect(result.tag).toEqual({ 'key': 'value' })
		expect(result.messages).toEqual(token.messages)
	})
	test('type and tag', () => {
		const transform_json = { 'type': TOKEN_TYPE.FUNCTION_WORD, 'tag': { 'key': 'value' } }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD)
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
		expect(result.tag).toEqual({ 'key': 'value' })
		expect(result.messages).toEqual(token.messages)
	})
	test('unrecognized', () => {
		const transform_json = { 'other': 'other' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'token' })
		const result = transform(token)
		expect(result).toEqual(token)
	})
})