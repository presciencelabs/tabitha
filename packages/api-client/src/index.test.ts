import { describe, expect, test, vi } from 'vitest'
import {
	cached_json,
	create_editor_client,
	create_http_client,
	create_ontology_client,
	create_sources_client,
	create_targets_client,
	ONE_DAY_IN_SECONDS,
} from './index'

describe('@tabitha/api-client', () => {
	describe('cached_json', () => {
		test('returns a standard Response object with JSON body', async () => {
			const data = { message: 'hello', count: 42 }
			const response = cached_json(data)

			expect(response).toBeInstanceOf(Response)
			expect(response.status).toBe(200)
			expect(response.headers.get('content-type')).toBe('application/json')

			const body = await response.json()
			expect(body).toEqual(data)
		})

		test('sets default SWR Cache-Control header (24 hours = 86400s edge, 0s browser)', () => {
			const response = cached_json({ ok: true })
			expect(response.headers.get('cache-control')).toBe(
				`public, max-age=0, s-maxage=${ONE_DAY_IN_SECONDS}, stale-while-revalidate=${ONE_DAY_IN_SECONDS}, must-revalidate`,
			)
		})

		test('allows custom s_maxage duration via number', () => {
			const response = cached_json({ ok: true }, 3600)
			expect(response.headers.get('cache-control')).toBe(
				`public, max-age=0, s-maxage=3600, stale-while-revalidate=${ONE_DAY_IN_SECONDS}, must-revalidate`,
			)
		})

		test('allows custom options object', () => {
			const response = cached_json(
				{ ok: true },
				{
					browser_max_age_seconds: 60,
					s_maxage_seconds: 7200,
					stale_while_revalidate_seconds: 1800,
				},
			)
			expect(response.headers.get('cache-control')).toBe(
				'public, max-age=60, s-maxage=7200, stale-while-revalidate=1800, must-revalidate',
			)
		})
	})

	describe('create_http_client', () => {
		test('automatically normalizes trailing slashes and prepends base url', async () => {
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ status: 'ok' }),
			})
			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788/',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			await http.get('search')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/search')
		})

		test('supports declarative cache: true (appends ?v=1)', async () => {
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ status: 'ok' }),
			})
			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
				cache: true,
			})

			await http.get('/search?q=love')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/search?q=love&v=1')
		})

		test('does not append version query param when cache is false or omitted', async () => {
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ status: 'ok' }),
			})
			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			await http.get('/search?q=love')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/search?q=love')
		})

		test('does not append version query param to POST requests', async () => {
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ status: 'ok' }),
			})
			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
				cache: true,
			})

			await http.post('/check', { text: 'hello' })
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: 'hello' }),
			})
		})

		test('get parses JSON on ok response and returns null on error', async () => {
			const mock_fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: 1 }),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
				})

			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const ok_result = await http.get<{ id: number }>('/item')
			expect(ok_result).toEqual({ id: 1 })

			const error_result = await http.get<{ id: number }>('/not-found')
			expect(error_result).toBeNull()
		})

		test('post parses JSON on ok response and returns null on error', async () => {
			const mock_fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ status: 'created' }),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
				})

			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const ok_result = await http.post<{ status: string }>('/item', { name: 'test' })
			expect(ok_result).toEqual({ status: 'created' })

			const error_result = await http.post<{ status: string }>('/item', { name: 'test' })
			expect(error_result).toBeNull()
		})

		test('returns text for text/plain or text/csv responses', async () => {
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
				text: async () => 'sample,plain,text',
			})

			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const result = await http.get<string>('/export.csv')
			expect(result).toBe('sample,plain,text')
		})

		test('returns readable stream for text/event-stream responses', async () => {
			const mock_stream = {} as ReadableStream
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				headers: new Headers({ 'content-type': 'text/event-stream' }),
				body: mock_stream,
			})

			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const result = await http.get<ReadableStream>('/events')
			expect(result).toBe(mock_stream)
		})

		test('returns ArrayBuffer for binary/octet-stream responses', async () => {
			const mock_buffer = new ArrayBuffer(8)
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				headers: new Headers({ 'content-type': 'application/octet-stream' }),
				arrayBuffer: async () => mock_buffer,
			})

			const http = create_http_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const result = await http.get<ArrayBuffer>('/data.bin')
			expect(result).toBe(mock_buffer)
		})
	})

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

		test('appends version parameter when cache is enabled', async () => {
			const mock_results = [{ stem: 'write-01', sense: 'A', part_of_speech: 'Verb' }]
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_results,
			})

			const client = create_ontology_client({
				base_url: 'http://localhost.tabitha.bible:5173',
				fetch: mock_fetch as unknown as typeof fetch,
				cache: true,
			})

			await client.search_concepts({ q: 'write' })
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:5173/search?q=write&v=1')
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

		test('appends version parameter when cache is enabled', async () => {
			const mock_data = { id: 'GEN.1.1' }
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_data,
			})

			const client = create_sources_client({
				base_url: 'http://localhost.tabitha.bible:8789',
				fetch: mock_fetch as unknown as typeof fetch,
				cache: true,
			})

			await client.get_verse_source({ book: 'GEN', chapter: 1, verse: 1 })
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8789/Bible/GEN/1/1?v=1')
		})

		test('get_book_status queries lookup status endpoint', async () => {
			const mock_data = { status: 'Ready to Translate' }
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_data,
			})

			const client = create_sources_client({
				base_url: 'http://localhost.tabitha.bible:8789',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const status = await client.get_book_status('GEN')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8789/lookup/status/Bible/GEN')
			expect(status).toBe('Ready to Translate')
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

		test('appends version parameter when cache is enabled', async () => {
			const mock_features = { features: [] }
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_features,
			})

			const client = create_targets_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
				cache: true,
			})

			await client.get_features('Noun')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/features/Noun?v=1')
		})

		test('lookup_forms queries forms endpoint', async () => {
			const mock_forms = [{ stem: 'love', form: 'loved', form_name: 'past', category: 'Verb' }]
			const mock_fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mock_forms,
			})

			const client = create_targets_client({
				base_url: 'http://localhost.tabitha.bible:8788',
				fetch: mock_fetch as unknown as typeof fetch,
			})

			const forms = await client.lookup_forms('loved')
			expect(mock_fetch).toHaveBeenCalledWith('http://localhost.tabitha.bible:8788/English/lookup/forms?word=loved')
			expect(forms).toEqual(mock_forms)
		})
	})
})
