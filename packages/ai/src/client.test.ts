import { beforeEach, describe, expect, test, vi } from 'vitest'
import { create_ai_client } from './client'
import { AiResponseError } from './errors'
import type { AiGatewayConfig } from './types'

const fetch_mock = vi.fn()
vi.stubGlobal('fetch', fetch_mock)

const gateway: AiGatewayConfig = {
	account_id: 'acct-1',
	token: 'gw-token',
	project: 'my-project',
	location: 'us-central1',
}

function mock_response(text: string) {
	fetch_mock.mockResolvedValue({
		ok: true,
		json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
	})
}

describe('@tabitha/ai', () => {
	beforeEach(() => {
		fetch_mock.mockReset()
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	describe('create_ai_client', () => {
		test('sends the request to the Vertex AI gateway route with the gateway auth and metadata headers', async () => {
			mock_response('{}')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await ai.generate_text({ contents: 'hi' })

			const [url, init] = fetch_mock.mock.calls[0]
			expect(url).toBe(
				'https://gateway.ai.cloudflare.com/v1/acct-1/tabitha/google-vertex-ai/v1beta1/projects/my-project/locations/us-central1/publishers/google/models/gemini-3.5-flash:generateContent',
			)
			expect(init).toEqual(expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'content-type': 'application/json',
					'cf-aig-authorization': 'Bearer gw-token',
					'cf-aig-metadata': JSON.stringify({ app: 'ontology', feature: 'semantic-search' }),
				}),
			}))
		})

		test('merges a per-call httpOptions.headers override in without forwarding it into generationConfig', async () => {
			mock_response('{}')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await ai.generate_text({
				contents: 'hi',
				config: { httpOptions: { headers: { 'cf-aig-cache-ttl': '604800' } } },
			})

			const [, init] = fetch_mock.mock.calls[0]
			expect(init.headers).toEqual(expect.objectContaining({ 'cf-aig-cache-ttl': '604800' }))
			const body = JSON.parse(init.body)
			expect(body.generationConfig).not.toHaveProperty('httpOptions')
		})

		test('throws AiResponseError with the status on a non-ok gateway response, and logs the body for Observability', async () => {
			fetch_mock.mockResolvedValue({ ok: false, status: 502, statusText: 'Bad Gateway', text: async () => 'bad gateway' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_text({ contents: 'hi' })).rejects.toThrow(AiResponseError)
			await expect(ai.generate_text({ contents: 'hi' })).rejects.toThrow('502')
			expect(console.error).toHaveBeenCalledWith(expect.stringContaining('bad gateway'))
		})

		test('throws AiResponseError on a network failure, without ever calling response.json/.text', async () => {
			fetch_mock.mockRejectedValue(new Error('fetch failed'))
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_text({ contents: 'hi' })).rejects.toThrow(AiResponseError)
			expect(console.error).toHaveBeenCalled()
		})
	})

	describe('generate_json', () => {
		test('parses the response text as JSON', async () => {
			mock_response('{"hello":"world"}')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			const result = await ai.generate_json<{ hello: string }>({
				contents: { q: 1 },
				schema: { type: 'object' },
			})

			expect(result).toEqual({ hello: 'world' })
		})

		test('throws AiResponseError on an empty response', async () => {
			mock_response('')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_json({ contents: {}, schema: {} })).rejects.toThrow(AiResponseError)
		})

		test('throws AiResponseError on unparseable JSON', async () => {
			mock_response('not json')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_json({ contents: {}, schema: {} })).rejects.toThrow(AiResponseError)
		})

		test('layers package defaults, client defaults, and per-call overrides', async () => {
			mock_response('{}')
			const ai = create_ai_client({
				app: 'copilot',
				feature: 'brief',
				gateway,
				defaults: { topP: 0.9 },
			})

			await ai.generate_json({ contents: {}, schema: { type: 'object' }, config: { temperature: 0.5 } })

			const [, init] = fetch_mock.mock.calls[0]
			const body = JSON.parse(init.body)
			expect(body.generationConfig).toEqual(expect.objectContaining({
				seed: 42,
				topP: 0.9,
				temperature: 0.5,
				frequencyPenalty: 0.0,
				presencePenalty: 0.0,
				responseMimeType: 'application/json',
			}))
		})

		test('always uses the fixed model and seed, regardless of client defaults', async () => {
			mock_response('{}')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await ai.generate_json({ contents: {}, schema: { type: 'object' } })

			const [url, init] = fetch_mock.mock.calls[0]
			expect(url).toContain(':generateContent')
			expect(url).toContain('/models/gemini-3.5-flash')
			const body = JSON.parse(init.body)
			expect(body.generationConfig).toEqual(expect.objectContaining({ seed: 42, temperature: 0.0 }))
		})

		test('ignores an attempt to override the fixed seed', async () => {
			mock_response('{}')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await ai.generate_json({
				contents: {},
				schema: { type: 'object' },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed isn't a valid override key; this simulates a caller bypassing the type with `as any`.
				config: { seed: 41 } as any,
			})

			const [, init] = fetch_mock.mock.calls[0]
			const body = JSON.parse(init.body)
			expect(body.generationConfig.seed).toBe(42)
		})
	})

	describe('generate_text', () => {
		test('returns the raw response text', async () => {
			mock_response('hello there')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			const result = await ai.generate_text({ contents: 'hi' })

			expect(result).toBe('hello there')
		})

		test('throws AiResponseError on an empty response', async () => {
			mock_response('')
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_text({ contents: 'hi' })).rejects.toThrow(AiResponseError)
		})
	})
})
