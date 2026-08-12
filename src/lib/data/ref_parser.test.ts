import { describe, expect, it } from 'vitest'
import { parse_reference } from './ref_parser'

describe('parse_reference', () => {
	it('parses standard book, chapter, and verse', () => {
		const ref = parse_reference('Genesis 1:1')
		expect(ref).toEqual({
			type: 'Bible',
			id_primary: 'Genesis',
			id_secondary: '1',
			id_tertiary: '1',
		})
	})

	it('parses John 3:16 format', () => {
		const ref = parse_reference('John 3:16')
		expect(ref).toEqual({
			type: 'Bible',
			id_primary: 'John',
			id_secondary: '3',
			id_tertiary: '16',
		})
	})

	it('handles book with chapter only defaulting verse to 1', () => {
		const ref = parse_reference('Psalm 23')
		expect(ref).toEqual({
			type: 'Bible',
			id_primary: 'Psalm',
			id_secondary: '23',
			id_tertiary: '1',
		})
	})

	it('parses numbered book titles like 1 Corinthians 13:4', () => {
		const ref = parse_reference('1 Corinthians 13:4')
		expect(ref).toEqual({
			type: 'Bible',
			id_primary: '1 Corinthians',
			id_secondary: '13',
			id_tertiary: '4',
		})
	})

	it('handles leading and trailing whitespace', () => {
		const ref = parse_reference('  Matthew 5:7  ')
		expect(ref).toEqual({
			type: 'Bible',
			id_primary: 'Matthew',
			id_secondary: '5',
			id_tertiary: '7',
		})
	})

	it('defaults secondary and tertiary to 1 when only book name is provided', () => {
		const ref = parse_reference('Romans')
		expect(ref).toEqual({
			type: 'Bible',
			id_primary: 'Romans',
			id_secondary: '1',
			id_tertiary: '1',
		})
	})
})
