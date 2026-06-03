import { fetch_verses_for_chapter } from '$lib/lookups'
import { convert_to_sfm, get_copilot_result } from '$lib/server/copilot_core'
import { error, text } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params: { book, chapter }, url: { searchParams } }) {
	const chapter_int = parseInt(chapter)
	if (!chapter_int) {
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

	const last_verse = await fetch_verses_for_chapter(book, chapter_int)
	if (!last_verse) {
		console.error(`Error fetching verses for ${book} ${chapter}`)
		error(404, 'Chapter reference does not exist')
	}

	const all_verses = Array.from({ length: last_verse }, (_, i) => i + 1)

	/** @type {CopilotApiResult[]} */
	const results = await Promise.all(all_verses.map(async (verse) => {
		const reference = { book, chapter: chapter_int, verse }
		let result = await get_copilot_result(reference, settings)
		// if there was an error, try one more time
		if (result.error) {
			result = await get_copilot_result(reference, settings)
		}
		return result
	}))

	const sfm_text = [
		`\\c ${chapter_int}`,
		...results.map(convert_to_sfm(settings.lwc)),
	].join('\n')

	const filename = `${book} ${chapter} - TBTA Copilot Notes.sfm`

	return text(sfm_text, {
		headers: {
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	})
}
