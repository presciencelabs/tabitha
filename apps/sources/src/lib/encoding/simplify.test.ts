import { describe, expect, it } from 'vitest'
import { simplify_encoding } from './simplify'
import type { EncodingEntity } from '@tabitha/types'

/**
 * Helper to create a minimal EncodingEntity for test fixtures.
 * Only requires the fields that simplify_encoding actually reads.
 */
function entity(overrides: Partial<EncodingEntity> & { category: string, value: string }): EncodingEntity {
	return {
		category_abbr: '',
		feature_codes: '',
		features: [],
		noun_list_index: null,
		...overrides,
		// Partial<> makes the types of these also include 'undefined', which is incompatible
		concept: overrides.concept ?? null,
		pairing_concept: overrides.pairing_concept ?? null,
		pairing_type: overrides.pairing_type ?? null,
	}
}

/** Wraps entities in a clause boundary so structure_encoding includes them in output */
function in_clause(...entities: EncodingEntity[]): EncodingEntity[] {
	return [
		entity({ category: 'Clause', value: '{' }),
		...entities,
		entity({ category: '', value: '}' }),
	]
}

describe('simplify_encoding', () => {
	describe('concept formatting', () => {
		it('formats concept as stem-sense', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					concept: { stem: 'God', sense: 'A', part_of_speech: 'Noun' },
				}),
			))

			expect(result[0].children![0].concept).toBe('God-A')
		})

		it('formats pairing_concept as stem-sense', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'follower',
					concept: { stem: 'follower', sense: 'A', part_of_speech: 'Noun' },
					pairing_concept: { stem: 'disciple', sense: 'B', part_of_speech: 'Noun' },
				}),
			))

			expect(result[0].children![0].pairing_concept).toBe('disciple-B')
		})

		it('omits concept field when no concept exists', () => {
			const result = simplify_encoding(in_clause(
				entity({ category: 'Conjunction', value: 'and' }),
			))

			expect(result[0].children![0].concept).toBeUndefined()
		})
	})

	describe('target field', () => {
		it('includes target when present', () => {
			const result = simplify_encoding(in_clause(
				entity({ category: 'Noun', value: 'God', target: 'Dieu' }),
			))

			expect(result[0].children![0].target).toBe('Dieu')
		})

		it('omits target when not present', () => {
			const result = simplify_encoding(in_clause(
				entity({ category: 'Noun', value: 'God' }),
			))

			expect(result[0].children![0].target).toBeUndefined()
		})
	})

	describe('feature filtering', () => {
		it('removes features with empty string values', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [
						{ name: 'Number', value: 'Singular' },
						{ name: 'Gender', value: '' },
					],
				}),
			))

			expect(result[0].children![0].features).toEqual({ Number: 'Singular' })
		})

		it('removes features with dot values', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [
						{ name: 'Number', value: 'Singular' },
						{ name: 'Placeholder', value: '.' },
					],
				}),
			))

			expect(result[0].children![0].features).toEqual({ Number: 'Singular' })
		})

		it('removes "Not Applicable" and "Unspecified" features', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [
						{ name: 'Number', value: 'Singular' },
						{ name: 'Case', value: 'Not Applicable' },
						{ name: 'Gender', value: 'Unspecified' },
					],
				}),
			))

			expect(result[0].children![0].features).toEqual({ Number: 'Singular' })
		})

		it('removes Sequence features regardless of value', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [
						{ name: 'Number', value: 'Singular' },
						{ name: 'Sequence', value: '3' },
					],
				}),
			))

			expect(result[0].children![0].features).toEqual({ Number: 'Singular' })
		})

		it('removes category-specific default values like Noun Polarity=Affirmative', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [
						{ name: 'Number', value: 'Singular' },
						{ name: 'Polarity', value: 'Affirmative' },
					],
				}),
			))

			expect(result[0].children![0].features).toEqual({ Number: 'Singular' })
		})

		it('keeps Polarity=Negative for nouns (only Affirmative is filtered)', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [{ name: 'Polarity', value: 'Negative' }],
				}),
			))

			expect(result[0].children![0].features).toEqual({ Polarity: 'Negative' })
		})

		it('omits features object when all features are filtered out', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [
						{ name: 'Placeholder', value: '.' },
						{ name: 'Implicit', value: 'No' },
					],
				}),
			))

			expect(result[0].children![0].features).toBeUndefined()
		})

		it('includes noun_list_index in features when present', () => {
			const result = simplify_encoding(in_clause(
				entity({
					category: 'Noun',
					value: 'God',
					features: [{ name: 'Number', value: 'Singular' }],
					noun_list_index: '1',
				}),
			))

			expect(result[0].children![0].features).toEqual({ Number: 'Singular', 'Noun List Index': '1' })
		})
	})

	describe('tree structuring', () => {
		it('nests entities inside clause boundaries', () => {
			const entities = [
				entity({ category: 'Clause', value: '{' }),
				entity({ category: 'Noun', value: 'God', concept: { stem: 'God', sense: 'A', part_of_speech: 'Noun' } }),
				entity({ category: 'Verb', value: 'create', concept: { stem: 'create', sense: 'A', part_of_speech: 'Verb' } }),
				entity({ category: '', value: '}' }),
			]

			const result = simplify_encoding(entities)
			expect(result).toHaveLength(1)
			expect(result[0].category).toBe('Clause')
			expect(result[0].children).toHaveLength(2)
			expect(result[0].children![0].concept).toBe('God-A')
			expect(result[0].children![1].concept).toBe('create-A')
		})

		it('nests phrases inside clauses', () => {
			const entities = [
				entity({ category: 'Clause', value: '{' }),
				entity({ category: 'Noun Phrase', value: '(' }),
				entity({ category: 'Noun', value: 'God', concept: { stem: 'God', sense: 'A', part_of_speech: 'Noun' } }),
				entity({ category: '', value: ')' }),
				entity({ category: '', value: '}' }),
			]

			const result = simplify_encoding(entities)
			expect(result).toHaveLength(1)
			expect(result[0].category).toBe('Clause')
			expect(result[0].children).toHaveLength(1)
			expect(result[0].children![0].category).toBe('Noun Phrase')
			expect(result[0].children![0].children).toHaveLength(1)
			expect(result[0].children![0].children![0].concept).toBe('God-A')
		})

		it('excludes period entities from the output', () => {
			const result = simplify_encoding(in_clause(
				entity({ category: 'Noun', value: 'God' }),
				entity({ category: 'period', value: '.' }),
			))

			expect(result[0].children!.every(c => c.category !== 'period')).toBe(true)
		})

		it('handles multiple sibling clauses', () => {
			const entities = [
				entity({ category: 'Clause', value: '{' }),
				entity({ category: 'Noun', value: 'God' }),
				entity({ category: '', value: '}' }),
				entity({ category: 'Clause', value: '{' }),
				entity({ category: 'Verb', value: 'create' }),
				entity({ category: '', value: '}' }),
			]

			const result = simplify_encoding(entities)
			expect(result).toHaveLength(2)
			expect(result[0].children![0].category).toBe('Noun')
			expect(result[1].children![0].category).toBe('Verb')
		})
	})
})
