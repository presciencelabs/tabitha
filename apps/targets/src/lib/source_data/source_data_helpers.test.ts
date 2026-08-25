import { describe, expect, it, vi } from 'vitest'
import { fetch_source_data, get_sources_url } from './source_data_helpers'
import type { SourceReference } from '$lib/types'

const mockRef: SourceReference = {
	type: 'verse',
	id_primary: '1 Samuel',
	id_secondary: 21,
	id_tertiary: 1,
}

describe('source_data_helpers', () => {
	it('builds canonical source URL correctly', () => {
		const url = get_sources_url({ reference: mockRef, sources_api_host: 'https://sources.tabitha.bible' })
		expect(url).toBe('https://sources.tabitha.bible/verse/1 Samuel/21/1')
	})

	it('fetches source data with mocked fetch', async () => {
		const mockResponseData = {
			parsed_semantic_encoding: [
				{ value: '{', category: 'Clause', category_abbr: 'C', feature_codes: '' },
			],
		}

		const mockFetch = vi.fn().mockResolvedValue({
			json: vi.fn().mockResolvedValue(mockResponseData),
		})

		const result = await fetch_source_data({
			reference: mockRef,
			sources_api_host: 'https://sources.tabitha.bible',
			fetch_fn: mockFetch as unknown as typeof fetch,
		})

		expect(mockFetch).toHaveBeenCalledWith('https://sources.tabitha.bible/verse/1 Samuel/21/1')
		expect(result).toEqual(mockResponseData)
	})
})
