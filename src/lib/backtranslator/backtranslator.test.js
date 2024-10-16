import { textify } from '.'
import { describe, expect, test } from 'vitest'
import { MESSAGE_TYPE, create_added_token } from '$lib/parser/token'
import { tokenize_input } from '$lib/parser/tokenize'
import { clausify } from '$lib/parser/clausify'

/**
 * textify simply produces the plain text equivalent for each token, joined by a space.
 */
describe('textify', () => {

	test('You(people) will become-J _randomNote a house of the Spirit.', () => {
		const test_tokens = tokenize_input('You(people) will become-J _randomNote a house of the Spirit.')
		const expected = 'You will become a house of the Spirit .'

		const result = textify(clausify(test_tokens))
		expect(result).toBe(expected)
	})

	test('Jesus said to Jesus\' followers/disciples _implicit, ["You(followers) (imp) go."]', () => {
		const test_tokens = tokenize_input('Jesus said to Jesus\' followers/disciples _implicit, ["You(followers) (imp) go."]')
		const expected = 'Jesus said to Jesus\' disciples , " You (imp) go . "'

		const result = textify(clausify(test_tokens))
		expect(result).toBe(expected)
	})

	test('Added token', () => {
		const test_tokens = tokenize_input('This is a test.')
		test_tokens.splice(2, 0, create_added_token('added', { ...MESSAGE_TYPE.ERROR, message: 'message' }))
		const expected = 'This is a test .'

		const result = textify(clausify(test_tokens))
		expect(result).toBe(expected)
	})

})

// TODO need E2E testing for these
// describe('structural', () => {
// 	test('Imperatives', () => {
// 		const test_tokens = tokenize_input('You(person) (imp) go. And you(person) (imp) be happy.')
// 		const expected = 'Go. And be happy.'

// 		const result = backtranslate2(test_tokens)
// 		expect(result).toBe(expected)
// 	})

// 	test('Descriptive Relative Clauses', () => {
// 		const test_tokens = tokenize_input('John [who was with Mary] read 2 books [_descriptive that were big].')
// 		const expected = 'John, who was with Mary, read 2 books, that were big.'

// 		const result = backtranslate2(test_tokens)
// 		expect(result).toBe(expected)
// 	})
// })
