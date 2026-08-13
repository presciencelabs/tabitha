import { describe, expect, it } from 'vitest'
import { bible_books } from './lookups'

describe('bible_books catalog lookup', () => {
	it('maps book IDs to canonical book names', () => {
		expect(bible_books[1]).toBe('Genesis')
		expect(bible_books[9]).toBe('1 Samuel')
		expect(bible_books[40]).toBe('Matthew')
		expect(bible_books[66]).toBe('Revelation')
	})

	it('contains 66 canonical Bible books', () => {
		expect(Object.keys(bible_books)).toHaveLength(66)
	})
})
