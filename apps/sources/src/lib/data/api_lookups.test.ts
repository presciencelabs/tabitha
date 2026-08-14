import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetch_concept_ontology_data } from './api_lookups'

describe('fetch_concept_ontology_data', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn())
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns cached ontology_data if already populated on concept', async () => {
		const cachedConcept = {
			stem: 'God',
			sense: 'A',
			part_of_speech: 'Noun' as const,
			ontology_data: {
				stem: 'God',
				sense: 'A',
				part_of_speech: 'Noun' as const,
				level: '1',
				gloss: 'Supreme Being',
				categories: ['Noun'],
				status: 'in ontology',
			},
		}

		const result = await fetch_concept_ontology_data(cachedConcept)
		expect(result).toEqual(cachedConcept.ontology_data)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('fetches ontology data from API on success', async () => {
		const mockResponse = [
			{
				stem: 'God',
				sense: 'A',
				level: '1',
				gloss: 'Supreme Being',
				categories: ['Noun'],
				status: 'in ontology',
			},
		]

		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		} as Response)

		const concept = { stem: 'God', sense: 'A', part_of_speech: 'Noun' }
		const result = await fetch_concept_ontology_data(concept)

		expect(result.gloss).toBe('Supreme Being')
		expect(result.level).toBe('1')
		expect(fetch).toHaveBeenCalledTimes(1)
	})

	it('returns fallback data when HTTP response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			status: 404,
		} as Response)

		const concept = { stem: 'Unknown', sense: 'A', part_of_speech: 'Noun' }
		const result = await fetch_concept_ontology_data(concept)

		expect(result.stem).toBe('Unknown')
		expect(result.gloss).toBe('')
		expect(result.status).toBe('in ontology')
	})

	it('returns fallback data when fetch throws a network error', async () => {
		vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

		const concept = { stem: 'OfflineTerm', sense: 'A', part_of_speech: 'Noun' }
		const result = await fetch_concept_ontology_data(concept)

		expect(result.stem).toBe('OfflineTerm')
		expect(result.gloss).toBe('')
	})
})
