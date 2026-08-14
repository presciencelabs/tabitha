import { PUBLIC_TARGETS_API_HOST, PUBLIC_SOURCES_API_HOST } from '$env/static/public'

export async function fetch_encoding(verse_ref: VerseReference): Promise<SourceApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/Bible/${book}/${chapter}/${verse}/simple-json?glosses=true`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	return await response.json() as SourceApiResult
}

export async function fetch_target_text(verse_ref: VerseReference, project: string, preferred_audience: string): Promise<TargetApiResult|undefined> {
	const { book, chapter, verse } = verse_ref
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/${project}/${book}/${chapter}/${verse}`)
	if (!response.ok) {
		console.error(await response.text())
		return undefined
	}
	const results = await response.json() as TargetApiResult[]
	return results.find(res => res.audience === preferred_audience) || results.at(0)
}

export async function fetch_verses_for_chapter({ book, chapter }: ChapterReference): Promise<number|undefined> {
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

export const usfm_book_codes: Record<string, string> = {
	'Genesis': 'GEN',
	'Exodus': 'EXO',
	'Leviticus': 'LEV',
	'Numbers': 'NUM',
	'Deuteronomy': 'DEU',
	'Joshua': 'JOS',
	'Judges': 'JDG',
	'Ruth': 'RUT',
	'1 Samuel': '1SA',
	'2 Samuel': '2SA',
	'1 Kings': '1KI',
	'2 Kings': '2KI',
	'1 Chronicles': '1CH',
	'2 Chronicles': '2CH',
	'Ezra': 'EZR',
	'Nehemiah': 'NEH',
	'Esther': 'EST',
	'Job': 'JOB',
	'Psalms': 'PSA',
	'Proverbs': 'PRO',
	'Ecclesiastes': 'ECC',
	'Song of Songs': 'SNG',
	'Isaiah': 'ISA',
	'Jeremiah': 'JER',
	'Lamentations': 'LAM',
	'Ezekiel': 'EZK',
	'Daniel': 'DAN',
	'Hosea': 'HOS',
	'Joel': 'JOL',
	'Amos': 'AMO',
	'Obadiah': 'OBA',
	'Jonah': 'JON',
	'Micah': 'MIC',
	'Nahum': 'NAM',
	'Habakkuk': 'HAB',
	'Zephaniah': 'ZEP',
	'Haggai': 'HAG',
	'Zechariah': 'ZEC',
	'Malachi': 'MAL',

	'Matthew': 'MAT',
	'Mark': 'MRK',
	'Luke': 'LUK',
	'John': 'JHN',
	'Acts': 'ACT',
	'Romans': 'ROM',
	'1 Corinthians': '1CO',
	'2 Corinthians': '2CO',
	'Galatians': 'GAL',
	'Ephesians': 'EPH',
	'Philippians': 'PHP',
	'Colossians': 'COL',
	'1 Thessalonians': '1TH',
	'2 Thessalonians': '2TH',
	'1 Timothy': '1TI',
	'2 Timothy': '2TI',
	'Titus': 'TIT',
	'Philemon': 'PHM',
	'Hebrews': 'HEB',
	'James': 'JAS',
	'1 Peter': '1PE',
	'2 Peter': '2PE',
	'1 John': '1JN',
	'2 John': '2JN',
	'3 John': '3JN',
	'Jude': 'JUD',
	'Revelation': 'REV',
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

interface MttLevelInfo {
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