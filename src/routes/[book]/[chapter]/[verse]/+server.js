import { get_llm_cautions } from '$lib/llm'
import { fetch_encoding, fetch_target_text } from '$lib/lookups'
import { error, json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params: { book, chapter, verse }, url: { searchParams } }) {
	const chapter_int = parseInt(chapter)
	const verse_int = parseInt(verse)
	if (!chapter_int || !verse_int) {
		error(400, 'chapter or verse must be integers')
	}

	const param_settings = searchParams.get('settings')
	/** @type {CopilotSettings} */
	const settings = param_settings ? JSON.parse(param_settings) : {
		language_profile: {
			rhetorical_questions: true,
			clusivity: true,
			passive: true,
			dual: true,
			trial: true,
			honorifics: true,
			indirect_speech: true,
		},
		mtt_level: 'high_school',
		max_cautions: -1,
		lwc: 'English',
	}

	/** @type {Reference} */
	const reference = { book, chapter: chapter_int, verse: verse_int }

	const encoding = await fetch_encoding(reference)
	if (!encoding) {
		error(404, 'Verse reference does not exist')
	}

	console.log(reference)
	const english = await fetch_target_text(reference, 'English', 'Unchurched Adults')
	const english_text = english?.text || ''


	try {
		const llm_output = await get_llm_cautions(encoding, english_text, settings)
		/** @type {CopilotApiResult} */
		const result = {
			verse: reference,
			english_text,
			...llm_output,
		}
		return json(result)

	} catch (error) {
		console.error('Error fetching notes from LLM:', error)

		/** @type {CopilotApiResult} */
		const result = {
			verse: reference,
			english_text,
			cautions: [
				'Copilot notes had a temporary issue and could not be loaded. Please try again later.',
			],
		}
		return json(result)
	}
}
