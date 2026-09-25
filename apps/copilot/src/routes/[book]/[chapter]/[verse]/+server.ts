import { error } from '@sveltejs/kit'
import { get_verse_result } from '$lib/server/verse_result'
import { default_settings } from '$lib/lookups'
import type { RequestHandler } from './$types'
import type { VerseReference } from '@tabitha/types'
import type { CopilotSettings, CopilotStep, CopilotStreamLine } from '$lib/types'

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

	const stream = new ReadableStream<string>({
		async start(controller) {
			const send = (line: CopilotStreamLine) => controller.enqueue(`${JSON.stringify(line)}\n`)
			const on_step = (step: CopilotStep) => send({ type: 'step', step })

			try {
				send(await get_verse_result({ reference, settings, ai, on_step }))
			} catch (err) {
				console.error(`Error generating notes for ${book} ${chapter}:${verse}:`, err)
				send({ type: 'error', verse: reference, error: err instanceof Error ? err.message : 'Unexpected error occurred.' })
			} finally {
				controller.close()
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Cache-Control': 'no-cache',
			'X-Content-Type-Options': 'nosniff',
		},
	})
}
