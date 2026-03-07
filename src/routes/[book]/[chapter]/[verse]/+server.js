import { get_llm_suggestions } from '$lib/llm'
import { fetch_encoding, fetch_target_text } from '$lib/lookups'
import { error, json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params: { book, chapter, verse }, url: { searchParams } }) {
	const chapter_int = parseInt(chapter)
	const verse_int = parseInt(verse)
	if (!chapter_int || !verse_int) {
		error(400, 'chapter or verse must be integers')
	}

	/** @type {Reference} */
	const reference = { book, chapter: chapter_int, verse: verse_int }

	const encoding = await fetch_encoding(reference)
	if (!encoding) {
		error(404, 'Verse reference does not exist')
	}

	console.log(reference)
	const english = await fetch_target_text(reference, 'English', 'Unchurched Adults')

	/** @type {CopilotSettings} */
	const settings = {
		language_profile: {
			rhetorical_questions: true,
			clusivity: false,
			passive: true,
			dual: false,
			trial: false,
			honorifics: false,
		},
		mtt_level: 'high-school',
		max_suggestions: 5,
		// lwc: 'Swahili',
	}

	const result = await get_llm_suggestions(encoding, english, settings)
	return json(result)
}
