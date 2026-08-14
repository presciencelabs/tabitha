import { default_settings, fetch_verses_for_chapter, usfm_book_codes } from '$lib/lookups'
import { convert_to_usfm_for_discern, get_copilot_result } from '$lib/server/copilot_core'
import { error } from '@sveltejs/kit'
import { convert_to_usfm_for_brief, create_brief_for_verse, translate_json } from '$lib/server/brief/brief'

/** @type {import('./$types').RequestHandler} */
export async function GET({  params: { book, chapter }, url: { searchParams }, locals: { ai } }) {
	const chapter_int = parseInt(chapter)
	if (!chapter_int) {
		error(400, 'chapter must be an integer')
	}

	let start_verse = searchParams.has('v1') ? parseInt(searchParams.get('v0') || '') : 1
	let end_verse = searchParams.has('v1') ? parseInt(searchParams.get('v1') || '') : null

	const param_settings = JSON.parse(searchParams.get('settings') || '{}')
	/** @type {CopilotSettings} */
	const settings = {
		...default_settings,
		...param_settings,
		language_profile: {
			...default_settings.language_profile,
			...param_settings.language_profile ?? {},
		},
	}

	const chapter_ref = { book, chapter: chapter_int }
	const book_code = usfm_book_codes[book] ?? book

	const last_verse = await fetch_verses_for_chapter({ book, chapter: chapter_int })
	if (!last_verse) {
		console.error(`Error fetching verses for ${book} ${chapter}`)
		error(404, 'Chapter reference does not exist')
	}

	if (!start_verse) {
		start_verse = 1
	} else if (start_verse > last_verse) {
		start_verse = last_verse
	}
	if (!end_verse || end_verse > last_verse) {
		end_verse = last_verse
	}

	let total_verses = end_verse - start_verse + 1
	const filename = `${book_code} ${chapter} - TaBiThA ${settings.mode === 'brief' ? 'Brief' : 'Notes'}.sfm`
	const encoder = new TextEncoder()

	const stream = new ReadableStream({
		async start(controller) {
			try {
				controller.enqueue(encoder.encode(`\\id ${usfm_book_codes[chapter_ref.book] || chapter_ref.book}\n`))
				controller.enqueue(encoder.encode(`\\c ${chapter_int}\n`))

				const concurrency_limit = 5
				/** @type {string[]} */
				const sfm_verses = new Array(total_verses)
				let next_to_send = 0
				let next_to_start = 0
				let is_flushing = false

				// Flush ready sequential results to controller (translating in batches if in brief mode)
				async function flush() {
					if (is_flushing) return
					is_flushing = true

					try {
						while (next_to_send < total_verses && sfm_verses[next_to_send] !== undefined) {
							// Collect contiguous ready untranslated verses
							const batch = []
							while (next_to_send < total_verses && sfm_verses[next_to_send] !== undefined) {
								batch.push(sfm_verses[next_to_send])
								next_to_send++
							}

							// Translate batch in 1 LLM API call if in brief mode
							const translated_batch = settings.mode === 'brief'
								? await translate_json(batch, ai)
								: batch

							// Enqueue translated verses
							for (const sfm of translated_batch) {
								controller.enqueue(encoder.encode(sfm + '\n'))
							}
						}
					} finally {
						is_flushing = false
					}
				}

				async function worker() {
					while (next_to_start < total_verses) {
						const verse_idx = next_to_start++
						const verse = start_verse + verse_idx
						const reference = { book, chapter: chapter_int, verse }

						let result = await get_copilot_result(reference, settings, ai)
						if (result.error) {
							console.error(`Error fetching notes for ${book} ${chapter}:${verse} - ${result.error}. Retrying...`)
							result = await get_copilot_result(reference, settings, ai)
							if (result.error) {
								console.error(`Error fetching notes for ${book} ${chapter}:${verse} - ${result.error}.`)
							}
						}

						sfm_verses[verse_idx] = await get_sfm_for_verse(result, settings, ai)
						await flush()
					}
				}

				// Launch workers up to concurrency_limit
				const workers = []
				for (let i = 0; i < Math.min(concurrency_limit, total_verses); i++) {
					workers.push(worker())
				}

				await Promise.all(workers)
			} catch (err) {
				console.error('Error in batch streaming:', err)
				controller.error(err)
			} finally {
				controller.close()
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-cache',
			'X-Content-Type-Options': 'nosniff',
		},
	})
}

/**
 * 
 * @param {CopilotApiResult} result 
 * @param {CopilotSettings} settings 
 * @param {import('@google/genai/node').GoogleGenAI} ai 
 * @returns {Promise<string>}
 */
async function get_sfm_for_verse(result, settings, ai) {
	if (settings.mode === 'brief') {
		/** @type {BriefSettings} */
		const brief_settings = {
			...settings,
			rigor: 'HIGH',
			output_format: 'usfm',
			output_style: 'production',
		}

		let brief_output = await create_brief_for_verse(result, brief_settings, ai)
		// if there was an error, try one more time. the error itself is logged elsewhere
		if (!brief_output) {
			console.error(`${result.verse.book} ${result.verse.chapter}:${result.verse.verse} - Retrying to get brief notes...`)
			brief_output = await create_brief_for_verse(result, brief_settings, ai)
			if (!brief_output) {
				console.error(`${result.verse.book} ${result.verse.chapter}:${result.verse.verse} - Could not generate brief notes. Skipping this verse.`)
			}
		}

		return convert_to_usfm_for_brief(result.verse, brief_output)

	} else {
		return convert_to_usfm_for_discern(settings.lwc)(result)
	}
}
