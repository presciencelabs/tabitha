import { error, json } from '@sveltejs/kit'
import { get_copilot_result } from '$lib/server/copilot_core'
import { default_settings } from '$lib/lookups'
import type { RequestHandler } from './$types'

export async function GET({ params: { book, chapter, verse }, url: { searchParams }, locals: { ai } }: Parameters<RequestHandler>[0]) {
	const chapter_int = parseInt(chapter)
	const verse_int = parseInt(verse)
	if (!chapter_int || !verse_int) {
		error(400, 'chapter or verse must be integers')
	}

	const param_settings = JSON.parse(searchParams.get('settings') || '{}')
	const settings: CopilotSettings = {
		...default_settings,
		...param_settings,
		language_profile: {
			...default_settings.language_profile,
			...param_settings.language_profile ?? {},
		},
	}

	const reference: VerseReference = { book, chapter: chapter_int, verse: verse_int }

	const result = await get_copilot_result({ reference, settings, ai })
	return json(result)
}
