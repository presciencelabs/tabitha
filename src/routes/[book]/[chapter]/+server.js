import { fetch_verses_for_chapter } from '$lib/lookups'
import { convert_to_sfm, get_copilot_result } from '$lib/server/copilot_core'
import { error, text } from '@sveltejs/kit'
import { default_settings } from '$lib/lookups'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params: { book, chapter }, url: { searchParams } }) {
	const chapter_int = parseInt(chapter)
	if (!chapter_int) {
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
