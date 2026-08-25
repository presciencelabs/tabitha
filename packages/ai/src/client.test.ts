import { beforeEach, describe, expect, test, vi } from 'vitest'
import { create_ai_client } from './client'
import { AiResponseError } from './errors'
import type { AiGatewayConfig } from './types'

const generate_content = vi.fn()

vi.mock('@google/genai', () => ({
	GoogleGenAI: vi.fn().mockImplementation(() => ({
		models: { generateContent: generate_content },
	})),
}))

const gateway: AiGatewayConfig = {
	account_id: 'acct-1',
	token: 'gw-token',
	project: 'my-project',
	location: 'us-central1',
}

describe('@tabitha/ai', () => {
	beforeEach(() => {
		generate_content.mockReset()
	})

	describe('create_ai_client', () => {
		test('points the underlying client at the Vertex AI gateway route with the gateway auth and metadata headers', async () => {
			const { GoogleGenAI } = await import('@google/genai')

			create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			expect(GoogleGenAI).toHaveBeenCalledWith({
				apiKey: 'gw-token',
				vertexai: true,
				project: 'my-project',
				location: 'us-central1',
				httpOptions: {
					baseUrl: 'https://gateway.ai.cloudflare.com/v1/acct-1/tabitha/google-vertex-ai',
					headers: {
						'cf-aig-authorization': 'Bearer gw-token',
						'cf-aig-metadata': JSON.stringify({ app: 'ontology', feature: 'semantic-search' }),
					},
				},
			})
		})
	})

	describe('generate_json', () => {
		test('parses the response text as JSON', async () => {
			generate_content.mockResolvedValue({ text: '{"hello":"world"}' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			const result = await ai.generate_json<{ hello: string }>({
				contents: { q: 1 },
				schema: { type: 'object' },
			})

			expect(result).toEqual({ hello: 'world' })
		})

		test('throws AiResponseError on an empty response', async () => {
			generate_content.mockResolvedValue({ text: '' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_json({ contents: {}, schema: {} })).rejects.toThrow(AiResponseError)
		})

		test('throws AiResponseError on unparseable JSON', async () => {
			generate_content.mockResolvedValue({ text: 'not json' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_json({ contents: {}, schema: {} })).rejects.toThrow(AiResponseError)
		})

		test('layers package defaults, client defaults, and per-call overrides', async () => {
			generate_content.mockResolvedValue({ text: '{}' })
			const ai = create_ai_client({
				app: 'copilot',
				feature: 'brief',
				gateway,
				defaults: { topP: 0.9 },
			})

			await ai.generate_json({ contents: {}, schema: { type: 'object' }, config: { temperature: 0.5 } })

			expect(generate_content).toHaveBeenCalledWith(expect.objectContaining({
				model: 'gemini-3.5-flash',
				config: expect.objectContaining({
					seed: 42,
					topP: 0.9,
					temperature: 0.5,
					frequencyPenalty: 0.0,
					presencePenalty: 0.0,
				}),
			}))
		})

		test('always uses the fixed model and seed, regardless of client defaults', async () => {
			generate_content.mockResolvedValue({ text: '{}' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await ai.generate_json({ contents: {}, schema: { type: 'object' } })

			expect(generate_content).toHaveBeenCalledWith(expect.objectContaining({
				model: 'gemini-3.5-flash',
				config: expect.objectContaining({ seed: 42, temperature: 0.0 }),
			}))
		})

		test('ignores an attempt to override the fixed model or seed', async () => {
			generate_content.mockResolvedValue({ text: '{}' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await ai.generate_json({
				contents: {},
				schema: { type: 'object' },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- model/seed aren't valid override keys; this simulates a caller bypassing the type with `as any`.
				config: { model: 'gemini-2.5-flash', seed: 41 } as any,
			})

			expect(generate_content).toHaveBeenCalledWith(expect.objectContaining({
				model: 'gemini-3.5-flash',
				config: expect.objectContaining({ seed: 42 }),
			}))
		})
	})

	describe('generate_text', () => {
		test('returns the raw response text', async () => {
			generate_content.mockResolvedValue({ text: 'hello there' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			const result = await ai.generate_text({ contents: 'hi' })

			expect(result).toBe('hello there')
		})

		test('throws AiResponseError on an empty response', async () => {
			generate_content.mockResolvedValue({ text: '' })
			const ai = create_ai_client({ app: 'ontology', feature: 'semantic-search', gateway })

			await expect(ai.generate_text({ contents: 'hi' })).rejects.toThrow(AiResponseError)
		})
	})
})
