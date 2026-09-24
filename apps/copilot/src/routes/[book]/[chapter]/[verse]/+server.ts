import { error } from '@sveltejs/kit'
import { get_copilot_result } from '$lib/server/copilot_core'
import { create_brief_for_verse, translate_json } from '$lib/server/brief/brief'
import { default_settings } from '$lib/lookups'
import type { RequestHandler } from './$types'
import type { AiClient } from '@tabitha/ai'
import type { VerseReference, CopilotResult } from '@tabitha/types'
import type { BriefInput, CopilotSettings, CopilotStep, CopilotStreamLine } from '$lib/types'

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
				send(await get_result({ reference, settings, ai, on_step }))
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

type GetResultOptions = {
	reference: VerseReference
	settings: CopilotSettings
	ai: AiClient
	on_step: (step: CopilotStep) => void
}

async function get_result({ reference, settings, ai, on_step }: GetResultOptions): Promise<CopilotResult> {
	on_step('notes')
	const result = await get_copilot_result({ reference, settings, ai })
	if (result.type === 'error' || settings.mode !== 'brief') return result

	const brief_input: BriefInput = {
		verse: reference,
		notes_result: result,
		settings: {
			...settings,
			rigor: 'HIGH',
			output_format: 'usfm',
			output_style: 'production',
		},
	}
	const brief_result = await create_brief_for_verse({ input: brief_input, ai, on_step })
	if (brief_result.type === 'error' || settings.lwc === 'English') return brief_result

	on_step('translate')
	return translate_json({ obj: brief_result, ai })
}
