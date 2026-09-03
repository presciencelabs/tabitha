import { describe, expect, it } from 'vitest'
import { encode_concept_data, get_noun_list, structure_semantic_encoding } from './semantic_encoding'
import type { SourceEntity } from '@tabitha/types'

describe('encode_concept_data', () => {
	it('encodes paired concepts correctly', () => {
		const entity: SourceEntity = {
			category: 'Noun',
			category_abbr: 'N',
			value: 'god',
			feature_codes: '1A1s',
			features: [],
			concept: { stem: 'god', sense: 'A', part_of_speech: 'Noun' },
			pairing_concept: { stem: 'creator', sense: 'B', part_of_speech: 'Noun' },
			pairing_type: 'simple-complex',
			noun_list_index: null,
		}

		const result = encode_concept_data(entity)
		expect(result.value).toBe('god/Bcreator')
	})

	it('encodes single concept correctly', () => {
		const entity = {
			category: 'Noun',
			category_abbr: 'N',
			value: 'god',
			feature_codes: '1A1s',
			features: [],
			concept: { stem: 'God', sense: 'A', part_of_speech: 'Noun' },
			pairing_concept: null,
			pairing_type: null,
			noun_list_index: null,
		}

		const result = encode_concept_data(entity)
		expect(result.value).toBe('God')
	})

	it('returns value unchanged when no concept exists', () => {
		const entity = {
			category: 'Punctuation',
			category_abbr: 'P',
			value: '.',
			feature_codes: '',
			features: [],
			concept: null,
			pairing_concept: null,
			pairing_type: null,
			noun_list_index: null,
		}

		const result = encode_concept_data(entity)
		expect(result.value).toBe('.')
	})
})

describe('structure_semantic_encoding', () => {
	it('assigns ids and structures boundary hierarchy', () => {
		const rawEntities = [
			{
				category: 'Clause',
				category_abbr: 'C',
				value: '{',
				feature_codes: '',
				features: [],
				concept: null,
				pairing_concept: null,
				pairing_type: null,
				noun_list_index: null,
			},
			{
				category: 'Noun',
				category_abbr: 'N',
				value: 'God',
				feature_codes: 's',
				features: [],
				concept: { stem: 'God', sense: 'A', part_of_speech: 'Noun' },
				pairing_concept: null,
				pairing_type: null,
				noun_list_index: '1',
			},
			{
				category: 'Clause',
				category_abbr: 'C',
				value: '}',
				feature_codes: '',
				features: [],
				concept: null,
				pairing_concept: null,
				pairing_type: null,
				noun_list_index: null,
			},
		]

		const structured = structure_semantic_encoding(rawEntities)
		expect(structured).toHaveLength(3)
		expect(structured[0].id).toBe(0)
		expect(structured[1].id).toBe(1)
		expect(structured[2].id).toBe(2)
		expect(structured[1].parent_id).toBe(0) // Child of the open clause
	})
})

describe('get_noun_list', () => {
	it('extracts noun list items and formats index labels', () => {
		const mockSource = {
			type: 'Bible',
			id_primary: 'Genesis',
			id_secondary: '1',
			id_tertiary: '1',
			phase_1_encoding: 'In the beginning...',
			semantic_encoding: '...some encoding...~|AGod|Bearth|Clight',
			status: 'Ready to Translate' as const,
			comments: '',
			notes: '',
		}

		const nounList = get_noun_list(mockSource)
		expect(nounList).toEqual([
			{ noun: 'God-A', index: '1' },
			{ noun: 'earth-B', index: '2' },
			{ noun: 'light-C', index: '3' },
		])
	})
})
