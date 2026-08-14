import { describe, expect, it } from 'vitest'
import { get_function_words } from './function_words'
import type { ConceptSearchFilter } from '$lib/types'

describe('function_words', () => {
	it('returns matching function words for exact search', () => {
		const filter: ConceptSearchFilter = {
			q: 'could',
			scope: 'stems',
			category: 'all',
		}

		const results = get_function_words(filter)
		expect(results).toHaveLength(1)
		expect(results[0].stem).toBe('could')
		expect(results[0].part_of_speech).toBe('Function Word')
		expect(results[0].status).toBe('function_word')
		expect(results[0].pending_changes).toEqual([])
	})

	it('returns matching function words for prefix and substring wildcards', () => {
		const prefixFilter: ConceptSearchFilter = {
			q: '*y',
			scope: 'all',
			category: '',
		}

		const prefixResults = get_function_words(prefixFilter)
		expect(prefixResults.map(r => r.stem)).toContain('certainly')
		expect(prefixResults.map(r => r.stem)).toContain('may')
		expect(prefixResults.map(r => r.stem)).toContain('very')

		const subFilter: ConceptSearchFilter = {
			q: '*ly*',
			scope: 'all',
			category: '',
		}
		const subResults = get_function_words(subFilter)
		expect(subResults.map(r => r.stem)).toContain('certainly')
		expect(subResults.map(r => r.stem)).toContain('definitely')
		expect(subResults.map(r => r.stem)).toContain('extremely')
		expect(subResults.map(r => r.stem)).toContain('probably')
	})

	it('returns empty array when scope is glosses', () => {
		const filter: ConceptSearchFilter = {
			q: 'could',
			scope: 'glosses',
			category: 'all',
		}

		expect(get_function_words(filter)).toEqual([])
	})

	it('returns empty array when category is specific part of speech', () => {
		const filter: ConceptSearchFilter = {
			q: 'could',
			scope: 'stems',
			category: 'Verb',
		}

		expect(get_function_words(filter)).toEqual([])
	})
})
