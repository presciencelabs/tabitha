import { fetch_verses_for_chapter, usfm_book_codes } from '$lib/lookups'
import { convert_to_sfm, get_copilot_result } from '$lib/server/copilot_core'
import { error, text } from '@sveltejs/kit'
import { default_settings } from '$lib/lookups'
import { create_brief_for_chapter } from '$lib/server/brief/brief'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params: { book, chapter }, url: { searchParams } }) {
	const chapter_int = parseInt(chapter)
	if (!chapter_int) {
		error(400, 'chapter must be an integer')
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

	const chapter_ref = { book, chapter: chapter_int }
	const book_code = usfm_book_codes[book] ?? book

	/** @type {string} */
	let sfm_text

	/** @type {string} */
	let filename

	if (settings.mode === 'brief') {
		sfm_text = await create_brief_for_chapter(chapter_ref, {
			...settings,
			rigor: 'HIGH',
			output_format: 'usfm',
			output_style: 'production',
		}) || ''

		filename = `${book_code} ${chapter} - TaBiThA Brief.sfm`

	} else {
		const last_verse = await fetch_verses_for_chapter({ book, chapter: chapter_int })
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
				console.error(`Error fetching notes from LLM for ${book} ${chapter}: ${verse} - ${result.error}. Trying again once more...`)
				result = await get_copilot_result(reference, settings)
				if (result.error) {
					console.error(`Error fetching notes from LLM for ${book} ${chapter}: ${verse} - ${result.error}.`)
				}
			}
			return result
		}))

		sfm_text = [
			`\\c ${chapter_int}`,
			...results.map(convert_to_sfm(settings.lwc)),
		].join('\n')

		filename = `${book_code} ${chapter} - TaBiThA Notes.sfm`
	}

	return text(sfm_text, {
		headers: {
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	})
}
