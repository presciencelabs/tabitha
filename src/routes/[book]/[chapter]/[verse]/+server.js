import { error, json } from '@sveltejs/kit'
import { get_copilot_result } from '$lib/server/copilot_core'
import { default_settings } from '$lib/lookups'
import { GoogleGenAI } from '@google/genai/node'
import { env } from '$env/dynamic/private'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params: { book, chapter, verse }, url: { searchParams } }) {
	const chapter_int = parseInt(chapter)
	const verse_int = parseInt(verse)
	if (!chapter_int || !verse_int) {
		error(400, 'chapter or verse must be integers')
	}

	const param_settings = JSON.parse(searchParams.get('settings') || '{}')
	/** @type {CopilotSettings} */
	const settings = {
		...default_settings,
		...param_settings,
		language_profile: {
			...default_settings.language_profile,
			...(param_settings.language_profile ?? {})
		},
	}

	/** @type {VerseReference} */
	const reference = { book, chapter: chapter_int, verse: verse_int }
	
	const ai = new GoogleGenAI({
		vertexai: true,
		project: env.GEMINI_PROJECT_ID,
		location: env.GEMINI_LOCATION,
		googleAuthOptions: {
			credentials: {
				client_email: env.GEMINI_CLIENT_EMAIL,
				private_key: env.GEMINI_PRIVATE_KEY?.replaceAll(/\\n/g, '\n'),
			}
		}
	})

	const result = await get_copilot_result(reference, settings, ai)
	return json(result)
}
