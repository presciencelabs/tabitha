import { json } from '@sveltejs/kit'
import OpenAI from 'openai'
import { PHASE1_AI_ASSIST_API_KEY } from '$env/static/private'


/** @type {import('./$types').RequestHandler} */
export async function POST({ request,  }) {
	const { message, temperature, frequency_penalty, presence_penalty } = await request.json()

	const openai = new OpenAI({ apiKey: PHASE1_AI_ASSIST_API_KEY })

	const chat_response = await openai.chat.completions.create({
		messages: [
			{ 'role': 'system', 'content': 'You are a helpful assistant.' },
			{ 'role': 'user', 'content': message },
		],
		model: 'ft:gpt-3.5-turbo-0125:personal::9UjdoEtZ',
		max_tokens: 2048,
		temperature,
		frequency_penalty,
		presence_penalty,
	})

	return response({
		finish_reason: chat_response.choices[0].finish_reason,
		message: chat_response.choices[0].message.content ?? '',
	})

	/** @param {{ finish_reason: string, message: string }} result  */
	function response(result) {
		return json(result)
	}
}
