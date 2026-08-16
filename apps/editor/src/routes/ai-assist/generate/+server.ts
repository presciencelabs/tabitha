import { env } from '$env/dynamic/private'
import { json } from '@sveltejs/kit'
import { GoogleGenAI } from '@google/genai'
import type { RequestEvent } from './$types'

export async function POST({ request }: RequestEvent) {
	const { message, temperature, frequency_penalty, presence_penalty } = await request.json()

	const api_key = env.GEMINI_API_KEY
	if (!api_key) {
		return json({
			finish_reason: 'error',
			message: 'Missing GEMINI_API_KEY secret in environment.',
		}, { status: 500 })
	}

	const ai = new GoogleGenAI({ apiKey: api_key })

	try {
		const chat_response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: message,
			config: {
				systemInstruction: 'You are a helpful assistant for biblical linguistic translation and semantic encoding.',
				temperature: typeof temperature === 'number' ? temperature : 0.0,
				frequencyPenalty: typeof frequency_penalty === 'number' ? frequency_penalty : 0.0,
				presencePenalty: typeof presence_penalty === 'number' ? presence_penalty : 0.0,
			},
		})

		return json({
			finish_reason: 'stop',
			message: chat_response.text ?? '',
		})
	} catch (err: unknown) {
		const error_message = err instanceof Error ? err.message : 'Failed to generate content with Gemini.'
		return json({
			finish_reason: 'error',
			message: error_message,
		}, { status: 500 })
	}
}
