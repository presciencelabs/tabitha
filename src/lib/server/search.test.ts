import { describe, expect, it } from 'vitest'
import { normalize_wildcards, parse_search_query } from './search'

describe('parse_search_query', () => {
	it('parses single keyword queries correctly', () => {
		const parsed = parse_search_query('david')
		expect(parsed).toEqual({
			or_terms: [
				{ and_terms: ['david'] },
			],
		})
	})

	it('parses multi-word AND search queries', () => {
		const parsed = parse_search_query('david king')
		expect(parsed).toEqual({
			or_terms: [
				{ and_terms: ['david', 'king'] },
			],
		})
	})

	it('parses quoted search terms as exact phrases', () => {
		const parsed = parse_search_query('"son of david"')
		expect(parsed).toEqual({
			or_terms: [
				{ and_terms: ['son of david'] },
			],
		})
	})

	it('parses OR queries separated by pipes |', () => {
		const parsed = parse_search_query('david | saul | jonathan')
		expect(parsed).toEqual({
			or_terms: [
				{ and_terms: ['david'] },
				{ and_terms: ['saul'] },
				{ and_terms: ['jonathan'] },
			],
		})
	})

	it('normalizes wildcards * and # into SQL % wildcards', () => {
		expect(normalize_wildcards('follow*')).toBe('follow%')
		expect(normalize_wildcards('test#word')).toBe('test%word')
	})
})
