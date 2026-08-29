import { describe, expect, it } from 'vitest'
import { match as match_integer } from './integer'
import { match as match_book } from './valid_book'
import { match as match_project } from './valid_project'

describe('Route param matchers', () => {
	describe('integer matcher', () => {
		it('accepts valid non-negative integers', () => {
			expect(match_integer('1')).toBe(true)
			expect(match_integer('123')).toBe(true)
		})

		it('rejects non-digit strings', () => {
			expect(match_integer('abc')).toBe(false)
			expect(match_integer('12.3')).toBe(false)
			expect(match_integer('-5')).toBe(false)
		})
	})

	describe('valid_book matcher', () => {
		it('accepts valid book names', () => {
			expect(match_book('Genesis')).toBe(true)
			expect(match_book('1 Samuel')).toBe(true)
			expect(match_book('3 John')).toBe(true)
		})

		it('rejects invalid book strings', () => {
			expect(match_book('4 Kings')).toBe(false)
			expect(match_book('Book_123!')).toBe(false)
		})
	})

	describe('valid_project matcher', () => {
		it('accepts registered target-language projects', () => {
			expect(match_project('English')).toBe(true)
			expect(match_project('Swahili')).toBe(true)
			expect(match_project('Indonesian')).toBe(true)
			expect(match_project('Tagalog')).toBe(true)
		})

		it('rejects unregistered or malformed project names', () => {
			expect(match_project('Spanish')).toBe(false)
			expect(match_project('123')).toBe(false)
			expect(match_project('English_1')).toBe(false)
		})
	})
})
