import { describe, expect, test } from 'vitest'
import { apply_text_insertions, spaced_insertion_text } from './text_insertions'

describe('apply_text_insertions', () => {
	test('no insertions leaves the text unchanged', () => {
		expect(apply_text_insertions({ text: 'John saw.', insertions: [] })).toEqual({ text: 'John saw.', inserted_ranges: [] })
	})

	test('ranges account for earlier insertions, whatever order they are given in', () => {
		const text = 'One day that man saw all the people.'
		const insertions = [{ offset: 24, text: ' of' }, { offset: 7, text: ',' }]

		expect(apply_text_insertions({ text, insertions })).toEqual({
			text: 'One day, that man saw all of the people.',
			inserted_ranges: [{ start: 25, end: 28 }, { start: 7, end: 8 }],
		})
	})

	test('keeps line breaks in the surrounding text', () => {
		expect(apply_text_insertions({ text: 'John saw all\nthe people.', insertions: [{ offset: 12, text: ' of' }] }).text)
			.toBe('John saw all of\nthe people.')
	})
})

describe('spaced_insertion_text', () => {
	test.each([
		{ text: 'of', position: 'after', expected: ' of' },
		{ text: 'of', position: 'before', expected: 'of ' },
		{ text: ',', position: 'after', expected: ',' },
		{ text: ',', position: 'before', expected: ',' },
	] as const)('$text inserted $position', ({ text, position, expected }) => {
		expect(spaced_insertion_text({ text, position })).toBe(expected)
	})
})
