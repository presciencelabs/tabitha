import { PUBLIC_SOURCES_API_HOST, PUBLIC_TARGETS_API_HOST } from '$env/static/public'
import { create_sources_client, create_targets_client } from '@tabitha/api-client'
import { BRIEF_HEADINGS_ENGLISH } from './lookups'
import type { VerseReference, ChapterReference, SourceSimpleJsonResult, TargetTextResult } from '@tabitha/types'
import type { CopilotBriefHeadingsResult, CopilotResult } from '@tabitha/types/copilot'
import type { CopilotSettings } from '$lib/types'

const sources_client = create_sources_client({ base_url: PUBLIC_SOURCES_API_HOST, cache: true })
const targets_client = create_targets_client({ base_url: PUBLIC_TARGETS_API_HOST, cache: true })

export async function fetch_encoding(verse_ref: VerseReference): Promise<SourceSimpleJsonResult | null> {
	return sources_client.get_simplified_json(verse_ref, 'Bible', true)
}

export async function fetch_target_text({ verse_ref, project, preferred_audience }: { verse_ref: VerseReference, project: string, preferred_audience: string }): Promise<TargetTextResult | null> {
	return targets_client.get_target_text(verse_ref, project, preferred_audience)
}

export async function fetch_verses_for_chapter(chapter_ref: ChapterReference): Promise<number | null> {
	return sources_client.get_chapter_verses_count(chapter_ref, 'Bible')
}

export async function fetch_batch_cautions({ reference, start_verse, end_verse, settings, on_progress }: {
	reference: ChapterReference
	start_verse: number
	end_verse: number
	settings: CopilotSettings
	on_progress: (next_results: CopilotResult[]) => void
}): Promise<void> {
	const { book, chapter } = reference
	const params = JSON.stringify(settings)
	const response = await fetch(`/${book}/${chapter}?v0=${start_verse}&v1=${end_verse}&settings=${encodeURIComponent(params)}`)

	if (!response.ok || !response.body) {
		const message = await response.text() || 'Unexpected error occurred'
		throw new Error(message)
	}

	const reader = response.body.getReader()
	const decoder = new TextDecoder()

	let buffer = ''

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		// Decode the chunk of bytes into text and append to buffer
		buffer += decoder.decode(value, { stream: true })

		// Split the buffer by newline characters
		const lines = buffer.split('\n')

		// Keep the last (incomplete) line in the buffer
		buffer = lines.pop() || ''

		const next_results = lines.map(line => JSON.parse(line) as CopilotResult)
		on_progress(next_results)
	}
	
	// warn about any remaining text left over after the stream finishes
	if (buffer.trim()) {
		try {
			const result = JSON.parse(buffer) as CopilotResult
			on_progress([result])
		} catch {
			console.warn(`Leftover piece from streaming: "${buffer}"`)
		}
	}
}

export async function fetch_notes({ reference, settings }: { reference: VerseReference, settings: CopilotSettings }): Promise<CopilotResult> {
	const { book, chapter, verse } = reference
	const params = JSON.stringify(settings)
	const response = await fetch(`/${book}/${chapter}/${verse}?settings=${encodeURIComponent(params)}`)

	if (!response.ok) {
		return await response.json().catch(() => ({ type: 'error', verse: reference, error: 'Unexpected error occurred.' })) as CopilotResult
	}

	return await response.json() as CopilotResult
}

export async function fetch_brief_headings(lwc: string): Promise<CopilotBriefHeadingsResult> {
	if (lwc === 'English') {
		return BRIEF_HEADINGS_ENGLISH
	}
	const response = await fetch(`/lookups/brief_headings?lwc=${lwc}`)
	if (!response.ok) {
		console.warn(`Could not fetch brief headings for ${lwc}. Defaulting to English.`)
		return BRIEF_HEADINGS_ENGLISH
	}

	return await response.json() as CopilotBriefHeadingsResult
}