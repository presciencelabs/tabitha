import { describe, expect, it } from 'vitest'
import { decode_features, encode_features, is_used_in_source } from './features'

describe('decode_features', () => {
	it('returns empty result for empty feature codes', () => {
		const result = decode_features({ raw_feature_codes: '', category: 'Noun', all_features: new Map() })
		expect(result).toEqual({
			feature_codes: '',
			features: [],
			noun_list_index: null,
		})
	})

	it('parses Noun feature codes including noun_list_index', () => {
		const mockFeatureMap = new Map([
			[
				'Noun',
				[
					{
						name: 'Number',
						values: [
							{ code: 's', value: 'Singular' },
							{ code: 'p', value: 'Plural' },
						],
					},
				],
			],
		])

		// For Noun: raw_feature_codes = "1A1s" -> slice(3) = "s", noun_list_index = "1"
		const result = decode_features({ raw_feature_codes: '1A1s', category: 'Noun', all_features: mockFeatureMap })
		expect(result.noun_list_index).toBe('1')
		expect(result.feature_codes).toBe('s')
		expect(result.features).toEqual([{ name: 'Number', value: 'Singular' }])
	})

	it('parses non-Noun feature codes without noun_list_index', () => {
		const mockFeatureMap = new Map([
			[
				'Verb',
				[
					{
						name: 'Aspect',
						values: [{ code: 'p', value: 'Perfective' }],
					},
				],
			],
		])

		// For Verb: raw_feature_codes = "1Ap" -> slice(2) = "p", noun_list_index = null
		const result = decode_features({ raw_feature_codes: '1Ap', category: 'Verb', all_features: mockFeatureMap })
		expect(result.noun_list_index).toBeNull()
		expect(result.feature_codes).toBe('p')
		expect(result.features).toEqual([{ name: 'Aspect', value: 'Perfective' }])
	})
})

describe('encode_features', () => {
	it('encodes entity with concept, sense, noun_list_index, and feature_codes', () => {
		const entity = {
			category: 'Noun',
			category_abbr: 'N',
			value: 'god',
			feature_codes: 's',
			features: [],
			concept: { stem: 'God', sense: 'A', part_of_speech: 'Noun' },
			pairing_concept: null,
			pairing_type: null,
			noun_list_index: '1',
		}

		const encoded = encode_features(entity)
		expect(encoded).toBe('1A1s')
	})

	it('returns plain feature_codes when no concept exists', () => {
		const entity = {
			category: 'Punctuation',
			category_abbr: 'P',
			value: '.',
			feature_codes: 'xyz',
			features: [],
			concept: null,
			pairing_concept: null,
			pairing_type: null,
			noun_list_index: null,
		}

		const encoded = encode_features(entity)
		expect(encoded).toBe('xyz')
	})
})

describe('is_used_in_source', () => {
	it('filters out features starting with Spare', () => {
		const filter = is_used_in_source('Noun')
		expect(filter({ name: 'Spare 1' })).toBe(false)
		expect(filter({ name: 'Number' })).toBe(true)
	})
})
