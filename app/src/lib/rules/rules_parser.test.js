import {describe, expect, test} from 'vitest'
import {TOKEN_TYPE, create_token} from '../parser/token'
import {create_checker_action, create_token_context, create_token_filter, create_token_transform} from './rules_parser'

describe('token filters', () => {
	test('all', () => {
		const filter_json = 'all'
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token(']', TOKEN_TYPE.PUNCTUATION),
		]
		const results = tokens.map(token => filter(token))
		expect(results.every(result => result)).toBe(true)
	})
	test('by token', () => {
		const filter_json = { 'token': 'text' }
		const filter = create_token_filter(filter_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text-A'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
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
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
		]
		const results = tokens.map(token => filter(token))

		expect(results[0]).toBe(true)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(false)
	})
})

describe('context filters', () => {
	test('empty filter results in true', () => {
		const context_json = { }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results.every(result => result)).toBe(true)
	})
	test('invalid filter results in false', () => {
		const context_json = { 'followedby': 'invalid' }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results.some(result => result)).toBe(false)
	})
	test('followed by', () => {
		const context_json = { 'followedby': { 'token': 'other' } }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(false)
	})
	test('followed by with skip', () => {
		const context_json = { 'followedby': { 'token': 'other', 'skip': { 'token': 'skip' } } }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'skip'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'last'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0]).toBe(true)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(false)
		expect(results[3]).toBe(false)
	})
	test('preceded by', () => {
		const context_json = { 'precededby': { 'token': 'token' } }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(false)
		expect(results[3]).toBe(true)
	})
	test('preceded by with skip', () => {
		const context_json = { 'precededby': { 'token': 'token', 'skip': { 'token': 'skip' } } }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'skip'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'last'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(true)
		expect(results[2]).toBe(true)
		expect(results[3]).toBe(true)
		expect(results[4]).toBe(false)
	})
	test('preceded by and followed by', () => {
		const context_json = { 'precededby': { 'token': 'token' }, 'followedby': { 'token': 'token' } }
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('middle', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'middle'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
			create_token('last', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'last'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(false)
		expect(results[2]).toBe(true)
		expect(results[3]).toBe(false)
		expect(results[4]).toBe(false)
		expect(results[5]).toBe(false)
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
		const filter = create_token_context(context_json)

		const tokens = [
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'skip'}),
			create_token('middle', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'middle'}),
			create_token('skip', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'skip'}),
			create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
		]
		const results = tokens.map((_, i) => filter(tokens, i))

		expect(results[0]).toBe(false)
		expect(results[1]).toBe(false)
		expect(results[2]).toBe(true)
		expect(results[3]).toBe(true)
		expect(results[4]).toBe(true)
		expect(results[5]).toBe(false)
		expect(results[6]).toBe(false)
	})
})

describe('token transforms', () => {
	test('type', () => {
		const transform_json = { 'type': TOKEN_TYPE.FUNCTION_WORD }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'})
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
		expect(result.lookup_term).toBe(token.lookup_term)
		expect(result.message).toBe(token.message)
	})
	test('concept no lookup results', () => {
		const transform_json = { 'concept': 'concept-A' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'})
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(token.type)
		expect(result.lookup_term).toBe('concept-A')
		expect(result.concept?.stem).toBe('concept')
		expect(result.concept?.sense).toBe('A')
		expect(result.message).toBe(token.message)
	})
	test('concept with lookup results', () => {
		const transform_json = { 'concept': 'concept-A' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'})
		token.lookup_results.push({
			id: '0',
			stem: 'concept',
			sense: 'A',
			part_of_speech: 'Noun',
			level: 1,
			gloss: '',
		})

		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(token.type)
		expect(result.lookup_term).toBe('concept-A')
		expect(result.concept).toEqual(token.lookup_results[0])
		expect(result.message).toBe(token.message)
	})
	test('type and concept', () => {
		const transform_json = { 'type': TOKEN_TYPE.LOOKUP_WORD, 'concept': 'concept-A' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.FUNCTION_WORD)
		const result = transform(token)
		expect(result.token).toBe(token.token)
		expect(result.type).toBe(TOKEN_TYPE.LOOKUP_WORD)
		expect(result.lookup_term).toBe('concept-A')
		expect(result.message).toBe(token.message)
	})
	test('unrecognized', () => {
		const transform_json = { 'other': 'other' }
		const transform = create_token_transform(transform_json)

		const token = create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'})
		const result = transform(token)
		expect(result).toEqual(token)
	})
})

describe('checker actions', () => {
	test('followed by', () => {
		const action_json = { 'followedby': 'token', 'message': 'message' }
		const result = create_checker_action(action_json)

		expect(result).toBeDefined()
		expect(result?.preceded_by).toBeUndefined()
		expect(result?.followed_by).toBe('token')
		expect(result?.message).toBe('message')
	})
	test('preceded by', () => {
		const action_json = { 'precededby': 'token', 'message': 'message' }
		const result = create_checker_action(action_json)

		expect(result).toBeDefined()
		expect(result?.preceded_by).toBe('token')
		expect(result?.followed_by).toBeUndefined()
		expect(result?.message).toBe('message')
	})
	test('preceded and followed', () => {
		const action_json = { 'precededby': 'preceded', 'followedby': 'followed', 'message': 'message' }
		const result = create_checker_action(action_json)

		expect(result).toBeDefined()
		expect(result?.preceded_by).toBe('preceded')
		expect(result?.followed_by).toBe('followed')
		expect(result?.message).toBe('message')
	})
	test('message on trigger', () => {
		const action_json = { 'message': 'message' }
		const result = create_checker_action(action_json)

		expect(result).toBeDefined()
		expect(result?.preceded_by).toBeUndefined()
		expect(result?.followed_by).toBeUndefined()
		expect(result?.message).toBe('message')
	})
	test('no message', () => {
		const action_json = { 'followedby': 'token' }
		const result = create_checker_action(action_json)

		expect(result).toBeDefined()
		expect(result?.message).toBe('')
	})
})