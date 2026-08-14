import { describe, expect, it } from 'vitest'
import {
	create_fallback_concept,
	decode_categorization,
	encode_categorization,
	transform_curated_examples,
} from './transformers'

describe('transformers', () => {
	describe('transform_curated_examples', () => {
		it('returns empty array when input is empty string', () => {
			expect(transform_curated_examples('')).toEqual([])
		})

		it('decodes curated examples correctly', () => {
			const raw = '4,2,2,2|(NPA|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n'
			const result = transform_curated_examples(raw)

			expect(result).toHaveLength(1)
			expect(result[0].reference).toEqual({
				type: 'Bible',
				id_primary: 'Exodus',
				id_secondary: '2',
				id_tertiary: '2',
			})
			expect(result[0].sentence).toBe('The baby was beautiful.')
			expect(result[0].encoding).toEqual([
				{ category: 'NP', word: undefined, feature: { code: 'A', value: 'Agent' } },
				{ category: 'Word', word: 'baby', feature: undefined },
				{ category: 'Phrase end', word: undefined, feature: undefined },
				{ category: 'VP', word: undefined, feature: undefined },
				{ category: 'Word', word: 'be', feature: undefined },
				{ category: 'Phrase end', word: undefined, feature: undefined },
				{ category: 'AdjP', word: undefined, feature: { code: 'P', value: 'Predicative' } },
				{ category: 'Word', word: 'beautiful', feature: undefined },
				{ category: 'Phrase end', word: undefined, feature: undefined },
			])
		})

		it('decodes multiple curated example lines', () => {
			const raw = [
				'4,2,2,2|(NPA|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.',
				'4,17,2,2|(NPA|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.',
			].join('\n')

			const result = transform_curated_examples(raw)
			expect(result).toHaveLength(2)
			expect(result[0].sentence).toBe('The baby was beautiful.')
			expect(result[1].sentence).toBe('Xerxes searched for a beautiful virgin.')
			expect(result[1].reference.id_primary).toBe('Esther')
		})
	})

	describe('categorization decoders & encoders', () => {
		it('decodes and encodes noun categorizations', () => {
			expect(decode_categorization('Noun', 'A')).toEqual(['Abstracts'])
			expect(decode_categorization('Noun', 'o')).toEqual(['All other objects'])
			expect(decode_categorization('Noun', '')).toEqual(['No information available yet.'])

			expect(encode_categorization('Noun', ['Abstracts'])).toBe('A')
			expect(encode_categorization('Noun', ['All other objects'])).toBe('o')
			expect(encode_categorization('Noun', [])).toBe('o')
		})

		it('decodes and encodes verb theta grids', () => {
			const db_verb = 'Ab_______'
			const decoded = decode_categorization('Verb', db_verb)
			expect(decoded).toEqual(['Agent-like', '(Patient-like)'])

			const reencoded = encode_categorization('Verb', ['Agent-like', '(Patient-like)', '', '', '', '', '', '', ''])
			expect(reencoded).toBe('Ab_______')
		})

		it('decodes and encodes adjective categorizations', () => {
			const db_adj = 'GA_____'
			const decoded = decode_categorization('Adjective', db_adj)
			expect(decoded).toEqual([
				'Generic',
				'always used attributively',
				'never used predicatively without an argument',
				'never used predicatively with a nominal argument',
				'never used predicatively with a same participant clausal argument',
				'never used predicatively with a different participant clausal argument',
				'never used comparatively',
			])

			const reencoded = encode_categorization('Adjective', decoded)
			expect(reencoded).toBe('GA_____')
		})

		it('decodes and encodes particle categorizations (Adposition, Adverb, Conjunction)', () => {
			const db_adp = 'Ab_'
			const decoded = decode_categorization('Adposition', db_adp)
			expect(decoded).toEqual([
				'always used in Adjunct Phrases',
				'sometimes used in Noun-Noun Phrases',
				'never used in Abverbial Clauses',
			])

			const reencoded = encode_categorization('Adposition', decoded)
			expect(reencoded).toBe('Ab_')
		})

		it('handles fallback for unknown part of speech', () => {
			expect(decode_categorization('Unknown', 'xyz')).toEqual(['x', 'y', 'z'])
			expect(encode_categorization('Unknown', ['xyz'])).toBe('')
		})
	})

	describe('create_fallback_concept', () => {
		it('creates a concept with default values', () => {
			const fallback = create_fallback_concept()
			expect(fallback.id).toBe('')
			expect(fallback.stem).toBe('')
			expect(fallback.level).toBe('1')
			expect(fallback.status).toBe('not used')
			expect(fallback.categories).toEqual([])
		})

		it('merges custom properties over defaults', () => {
			const fallback = create_fallback_concept({ stem: 'love', sense: '01', part_of_speech: 'Noun' })
			expect(fallback.stem).toBe('love')
			expect(fallback.sense).toBe('01')
			expect(fallback.part_of_speech).toBe('Noun')
			expect(fallback.level).toBe('1')
		})
	})
})
