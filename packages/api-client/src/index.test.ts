import { describe, expect, test, vi } from 'vitest'
import {
	create_editor_client,
	create_ontology_client,
	create_sources_client,
	create_targets_client,
} from './index'

describe('@tabitha/api-client', () => {
	describe('create_editor_client', () => {
		test('calls /check endpoint and returns parsed json on 200', async () => {
			const mock_response = { status: 'ok', tokens: [], backtranslation: 'Paul writes.' }
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_response,
			})

			const client = create_editor_client({
				base_url: 'http://localhost.tabitha.bible:8790/',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const result = await client.check_text('Paul write-01')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8790/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: 'Paul write-01' }),
			})
			expect(result).toEqual(mock_response)
		})

		test('returns null when response is not ok', async () => {
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
			})

			const client = create_editor_client({
				base_url: 'http://localhost.tabitha.bible:8790',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const result = await client.check_text('invalid')
			expect(result).toBeNull()
		})
	})

	describe('create_ontology_client', () => {
		test('search_concepts formats query parameters correctly', async () => {
			const mock_results = [{ stem: 'write-01', sense: 'A', part_of_speech: 'Verb' }]
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_results,
			})

			const client = create_ontology_client({
				base_url: 'http://localhost.tabitha.bible:5173',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const results = await client.search_concepts({ q: 'write', category: 'Verb' })
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:5173/search?q=write&category=Verb')
			expect(results).toEqual(mock_results)
		})

		test('get_concept returns matching concept from search', async () => {
			const mock_results = [
				{ stem: 'write-01', sense: 'A', part_of_speech: 'Verb' },
				{ stem: 'write-01', sense: 'B', part_of_speech: 'Verb' },
			]
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_results,
			})

			const client = create_ontology_client({
				base_url: 'http://localhost.tabitha.bible:5173',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const concept = await client.get_concept('write-01', 'B')
			expect(concept?.sense).toBe('B')
		})
	})

	describe('create_sources_client', () => {
		test('get_verse_source queries correct REST path', async () => {
			const mock_data = { id: 'GEN.1.1' }
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_data,
			})

			const client = create_sources_client({
				base_url: 'http://localhost.tabitha.bible:8789',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const data = await client.get_verse_source({ book: 'GEN', chapter: 1, verse: 1 })
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8789/Bible/GEN/1/1')
			expect(data).toEqual(mock_data)
		})
	})

	describe('create_targets_client', () => {
		test('get_target_text queries project verse path and selects preferred audience', async () => {
			const mock_results = [
				{ audience: 'Children', text: 'In the beginning...' },
				{ audience: 'Unchurched Adults', text: 'In the beginning God created...' },
			]
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_results,
			})

			const client = create_targets_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const result = await client.get_target_text({ book: 'GEN', chapter: 1, verse: 1 })
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/English/GEN/1/1')
			expect(result?.text).toBe('In the beginning God created...')
		})

		test('get_features calls /features endpoint with optional category', async () => {
			const mock_features = { features: [] }
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_features,
			})

			const client = create_targets_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const features = await client.get_features('Noun')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/features/Noun')
			expect(features).toEqual(mock_features)
		})
	})
})
