import { error, json } from '@sveltejs/kit'
import { get_copilot_result } from '$lib/server/copilot_core'

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
			// rhetorical_questions: true,
			clusivity: true,
			passive: true,
			dual: true,
			trial: true,
			honorifics: true,
			// indirect_speech: true,
			closing_quotation_frame: true,
		},
		mtt_level: 'high_school',
		lwc: 'English',
		sensitivity: 1,
		show_english: true,
		show_note_sources: false,
	}

	/** @type {Reference} */
	const reference = { book, chapter: chapter_int, verse: verse_int }

	const result = await get_copilot_result(reference, settings)
	return json(result)
}
