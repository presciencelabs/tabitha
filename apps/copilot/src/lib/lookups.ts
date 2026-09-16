import { PUBLIC_SOURCES_API_HOST, PUBLIC_TARGETS_API_HOST } from '$env/static/public'
import { create_sources_client, create_targets_client } from '@tabitha/api-client'
import { USFM_VERSE_MARKER_REGEX } from '@tabitha/types/patterns'
import type { VerseReference, ChapterReference, SourceSimpleJsonResult, TargetTextResult } from '@tabitha/types'
import type { CopilotNotesResult } from '@tabitha/types/copilot'
import type { CopilotSettings, MttLevel, CopilotMode } from '$lib/types'

const sources_client = create_sources_client({ base_url: PUBLIC_SOURCES_API_HOST, cache: true })
const targets_client = create_targets_client({ base_url: PUBLIC_TARGETS_API_HOST, cache: true })

export async function fetch_encoding(verse_ref: VerseReference): Promise<SourceSimpleJsonResult | undefined> {
	const res = await sources_client.get_simplified_json(verse_ref, 'Bible', true)
	return res ?? undefined
}

export async function fetch_target_text({ verse_ref, project, preferred_audience }: { verse_ref: VerseReference, project: string, preferred_audience: string }): Promise<TargetTextResult | undefined> {
	const res = await targets_client.get_target_text(verse_ref, project, preferred_audience)
	return (res as TargetTextResult) ?? undefined
}

export async function fetch_verses_for_chapter({ book, chapter }: ChapterReference): Promise<number | undefined> {
	return await sources_client.get_chapter_verses_count({ book, chapter }, 'Bible')
}

export async function fetch_batch_cautions({ reference, start_verse, end_verse, settings, on_progress }: {
	reference: ChapterReference
	start_verse: number
	end_verse: number
	settings: CopilotSettings
	on_progress: (completed_delta: number) => void
}): Promise<string> {
	const { book, chapter } = reference
	const params = JSON.stringify(settings)
	const response = await fetch(`/${book}/${chapter}?v0=${start_verse}&v1=${end_verse}&settings=${encodeURIComponent(params)}`)

	if (!response.ok || !response.body) {
		const message = await response.text() || 'Unexpected error occurred'
		throw new Error(message)
	}

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let sfm_text = ''

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		const chunk_text = decoder.decode(value, { stream: true })
		sfm_text += chunk_text

		const matches = chunk_text.match(USFM_VERSE_MARKER_REGEX)
		if (matches) {
			on_progress(matches.length)
		}
	}

	return sfm_text
}

export async function fetch_notes({ reference, settings }: { reference: VerseReference, settings: CopilotSettings }): Promise<CopilotNotesResult> {
	const { book, chapter, verse } = reference
	const params = JSON.stringify(settings)
	const response = await fetch(`/${book}/${chapter}/${verse}?settings=${encodeURIComponent(params)}`)

	if (!response.ok) {
		const body = await response.json().catch(() => null)
		throw new Error(body?.message || 'Unexpected error occurred')
	}

	return await response.json() as CopilotNotesResult
}

export const polished_books = [
	'Genesis',
	// 'Joshua',
	'Ruth',
	// '1 Samuel',
	// '2 Samuel',
	// 'Nehemiah',
	// 'Esther',
	'Daniel',
	'Jonah',
	// 'Nahum',
	'Matthew',
	'Mark',
	'Luke',
	'John',
	'Acts',
	'Titus',
	// 'Philemon',
	'1 Peter',
	'2 Peter',
	'1 John',
	'2 John',
	'3 John',
	'Jude',
]

type LwcInfo = {
	code: string
	no_notes_text?: string
}
export const lwc_info: Record<string, LwcInfo> = {
	'English': {
		code: 'ENG',
		no_notes_text: 'No notes for this verse based on the TBTA analysis.',
	},
	// 'Afrikaans': {
	// 	code: 'AFR',
	// },
	// 'Arabic': {
	// 	code: 'ARB',
	// 	// no_notes_text: 'بحسب تحليل TBTA، فإن هذه الفقرة لا تقدم أي نصيحة.',
	// },
	// 'Cebuano': {
	// 	code: 'CEB',
	// 	// no_notes_text: 'Walay mga sugyot para niini nga bersikulo base sa pagtuki sa TBTA.',
	// },
	// 'French': {
	// 	code: 'FRE',
	// 	no_notes_text: "Aucune suggestion pour ce verset d'après l'analyse TBTA.",
	// },
	// 'Hindi': {
	// 	code: 'HIN',
	// 	// no_notes_text: 'TBTA एनालिसिस के आधार पर इस श्लोक के लिए कोई सुझाव नहीं है',
	// },
	'Indonesian': {
		code: 'IND',
		no_notes_text: 'Tidak ada saran untuk ayat ini berdasarkan analisis TBTA.',
	},
	// 'Malayalam': {
	// 	code: 'MAL',
	// },
	// 'Mandarin': {
	// 	code: 'MAN',
	// 	// no_notes_text: '根据TBTA分析，这节经文没有建议。',
	// },
	// 'Portugese (Br)': {
	// 	code: 'POR',
	// 	// no_notes_text: 'Nenhuma sugestão para este versículo com base na análise TBTA.',
	// },
	// 'Russian': {
	// 	code: 'RUS',
	// 	no_notes_text: 'Для этого стиха нет предложений на основе анализа TBTA.',
	// },
	// 'Spanish': {
	// 	code: 'SPA',
	// 	// no_notes_text: 'No hay sugerencias para este versículo según el análisis de TBTA.',
	// },
	'Swahili': {
		code: 'SWA',
		no_notes_text: 'Hakuna mapendekezo ya mstari huu kulingana na uchambuzi wa TBTA.',
	},
	'Tagalog': {
		code: 'TAG',
		no_notes_text: 'Walang mungkahi para sa talatang ito batay sa pagsusuri ng TBTA.',
	},
	// 'Tamil': {
	// 	code: 'TAM',
	// },
	// 'Tok Pisin': {
	// 	code: 'TKP',
	// 	no_notes_text: 'Nogat tingting long dispela ves bihainim TBTA analisis.',
	// },
}

export const default_target_audience: Record<string, string> = {
	'English': 'Unchurched Adults',
	'Indonesian': 'Unchurched Adults',
	'Swahili': 'All Helps',
	'Tagalog': 'Unchurched Adults',
}

type MttLevelInfo = {
	label: string
	code: string
}
export const mtt_level_info: Record<MttLevel, MttLevelInfo> = {
	'grade5': { label: 'Direct', code: 'G5' },
	'high_school': { label: 'Detailed', code: 'HS' },
	'undergraduate': { label: 'Technical', code: 'UG' },
}

export const copilot_modes: CopilotMode[] = [
	'brief',
	'discern',
]

export const default_settings: CopilotSettings = {
	language_profile: {
		multiple_past: false,
		multiple_future: false,
		noun_number: [],
		noun_proximity: [],
		noun_clusivity: false,
		as_third_handling: 'apposition',

		passive: 'agent_allowed',
		rhetorical_questions: true,
		honorifics: false,
		speech_formula_position: 'before',

		custom_weights: {},
		custom_combinations: [],
	},
	mtt_level: 'high_school',
	lwc: 'English',
	sensitivity: 1,
	show_english: true,
	show_note_sources: false,
	mode: 'brief',
}