import { PUBLIC_TARGETS_API_HOST, PUBLIC_SOURCES_API_HOST } from '$env/static/public'

export async function fetch_encoding(verse_ref: Reference): Promise<SourceApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/Bible/${book}/${chapter}/${verse}/simple-json?glosses=true`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	return await response.json() as SourceApiResult
}

export async function fetch_target_text(verse_ref: Reference, project: string, preferred_audience: string): Promise<TargetApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/${project}/${book}/${chapter}/${verse}`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	const results = await response.json() as TargetApiResult[]
	return results.find(res => res.audience === preferred_audience) || results.at(0)
}

export async function fetch_verses_for_chapter(book: string, chapter: number): Promise<number|undefined> {
	const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/Bible/${book}/${chapter}`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	const result = await response.json() as { id_tertiary: string }[]
	if (result.length === 0) {
		return 0
	}
	const last_verse = Math.max(...result.map(i => parseInt(i.id_tertiary)))
	return last_verse
}

export const polished_books = [
	// 'Genesis',
	// 'Joshua',
	// 'Ruth',
	// '1 Samuel',
	// '2 Samuel',
	// 'Nehemiah',
	// 'Esther',
	// 'Daniel',
	'Jonah',
	// 'Nahum',
	// 'Matthew',
	// 'Mark',
	// 'Acts',
	'Titus',
	// 'Philemon',
	// '3 John',
]

export const language_profile_infos: Record<keyof LanguageProfile, [string, string]> = {
	'rhetorical_questions': [
		'Rhetorical Questions',
		'Your language uses and understands rhetorical questions. If not, the copilot will show notes that suggest an equivalent statement for any rhetorical questions.',
	],
	'passive': [
		'Passive',
		'Your language has a passive voice. If not, the copilot will show notes that identify any actor that is not explicitly mentioned.',
	],
	'honorifics': [
		'Honorifics',
		'Your language has special markings or pronouns for acknowledging social relationships or dynamics. The copilot will show notes to help identify these relationships.',
	],
	'indirect_speech': [
		'Indirect Speech',
		'Your language uses indirect speech ("John said that Mary left"). If not, the copilot will show notes to help convert these to direct quotes.',
	],
	'clusivity': [
		'Inclusive and exclusive "we"',
		'Your language marks inclusive "we" (we with you) differently from exclusive "we" (we without you). The copilot will show notes for when "we" is exclusive.',
	],
	'dual': [
		'Dual number',
		'Your language has a special marking for when there are exactly two of a thing (eg "John\'s EYES"). The copilot will show notes to identify possible nouns that need this marking.',
	],
	'trial': [
		'Trial number',
		'Your language has a special marking for when there are exactly three of a thing (eg "We (three)"). The copilot will show notes to identify possible nouns that need this marking.',
	],
	'closing_quotation_frame': [
		'Closing quotation frames',
		'Your language closes a quotation by putting some special words in the end. The copilot will show notes to remind how longer quotes were introduced.',
	],
}

interface LwcInfo {
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
	'French': {
		code: 'FRE',
		no_notes_text: "Aucune suggestion pour ce verset d'après l'analyse TBTA.",
	},
	// 'Hindi': {
	// 	code: 'HIN',
	// 	// no_notes_text: 'TBTA एनालिसिस के आधार पर इस श्लोक के लिए कोई सुझाव नहीं है',
	// },
	// 'Indonesian': {
	// 	code: 'IND',
	// 	no_notes_text: 'Tidak ada saran untuk ayat ini berdasarkan analisis TBTA.',
	// },
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
	// 'Tagalog': {
	// 	code: 'TAG',
	// 	no_notes_text: 'Walang mungkahi para sa talatang ito batay sa pagsusuri ng TBTA.',
	// },
	// 'Tamil': {
	// 	code: 'TAM',
	// },
	// 'Tok Pisin': {
	// 	code: 'TKP',
	// 	no_notes_text: 'Nogat tingting long dispela ves bihainim TBTA analisis.',
	// },
}

interface MttLevelInfo {
	label: string
	code: string
}
export const mtt_level_info: Record<MttLevel, MttLevelInfo> = {
	'grade5': { label: 'Direct', code: 'G5' },
	'high_school': { label: 'Detailed', code: 'HS' },
	'undergraduate': { label: 'Technical', code: 'UG' },
}