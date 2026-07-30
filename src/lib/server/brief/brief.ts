import { env } from '$env/dynamic/private'
import { fetch_verses_for_chapter, lwc_info, usfm_book_codes } from '$lib/lookups'
import type { GoogleGenAI } from '@google/genai/node'
import { brief_main_prompt, translate_prompt } from './prompts'
import { json_response_schema } from './json_response_schema'
import { get_copilot_result } from '../copilot_core'

async function get_aquifer_content_ids(verse: VerseReference): Promise<number[]> {
	const queryParams = new URLSearchParams({
		languageCode: 'eng',
		resourceCollectionCode: 'SILOpenTranslatorsNotes',
		bookCode: usfm_book_codes[verse.book],
		startChapter: verse.chapter.toString(),
		endChapter: verse.chapter.toString(),
		startVerse: verse.verse.toString(),
		endVerse: verse.verse.toString(),
	})
	const response = await fetch(`https://api.aquifer.bible/resources/search?${queryParams.toString()}`, {
		headers: {
			'api-key': env.API_KEY_AQUIFER,
		},
	})

	if (!response.ok) {
		console.error(`HTTP error: received response of status ${response.status} (${response.statusText}) from ${response.url}`)
		return []
	}

	const result = await response.json() as { items: { id: number }[] }
	return result.items.map(({ id }) => id)
}

async function get_tnn_based_info(input: BriefInput, ai: GoogleGenAI): Promise<BriefTnnBasedOutput | undefined> {
	// get prompt from Aquifer
	const contentId = (await get_aquifer_content_ids(input.verse))[0]

	const aquifer_response = await fetch(`https://api.aquifer.bible/resources/${contentId}`, {
		headers: {
			"api-key": env.API_KEY_AQUIFER,
		},
	})

	if (!aquifer_response.ok) {
		console.error(`HTTP error: received response of status ${aquifer_response.status} (${aquifer_response.statusText}) from ${aquifer_response.url}`)
		return undefined
	}
	const prompt = {
		verseReference: `${input.verse.book} ${input.verse.chapter}:${input.verse.verse}`,
		rigorMode: input.rigor,
		tnnText: await aquifer_response.text(),
		lwcVerse: input.lwc_text,
		tabithaNotes: input.notes,
	}

	const llm_response = await ai.models.generateContent({
		model: 'gemini-3.5-flash',
		contents: JSON.stringify(prompt),
		config: {
			temperature: 0.0,
			seed: 41,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0,
			systemInstruction: brief_main_prompt,
			responseMimeType: 'application/json',
			responseJsonSchema: json_response_schema,
		}
	})

	if (!llm_response.text) {
		console.error(`Gemini error: with headers ${llm_response.sdkHttpResponse?.headers}`)
		return undefined
	}
	return JSON.parse(llm_response.text)
}

function format_weight(weight: number) {
	const max = 5
	return '●'.repeat(weight) + '○'.repeat(max - weight)
}

function format_verdict(verdict: any) {
	switch (verdict.type) {
		case 'SECTION 5':
			return `→ SECTION 5 (${verdict.subtype})`
		case 'SOLVED':
			return `SOLVED — ${verdict.reason}`
		case 'CUT':
			return `CUT (${verdict.subtype} — ${verdict.reason})`
		default:
			return verdict.type
	}
}

const translationOpener = '[['
const translationDelimiter = '||'
const translationCloser = ']]'
const placeholderOpener = '{{'
const placeholderCloser = '}}'

function mark_for_translation(text: string, targetLanguageName: string, sourceLanguageName: string = 'English'): string {
	return sourceLanguageName != targetLanguageName ? `${translationOpener}${text}${translationDelimiter}${sourceLanguageName}${translationDelimiter}${targetLanguageName}${translationCloser}` : text
}

async function translate_json<T>(obj: T, ai: GoogleGenAI): Promise<T> {
	const placeholder_map = new Map<string, number>()

	// TODO use Regex?
	const prompt = []
	let text = JSON.stringify(obj)
	while (true) {
		const openerIndex = text.indexOf(translationOpener)
		if (openerIndex == -1)
			break
		const closerIndex = text.indexOf(translationCloser, openerIndex + translationOpener.length)
		const parts = text.substring(openerIndex + translationOpener.length, closerIndex).split(translationDelimiter)

		let placeholder: number
		if (placeholder_map.has(parts[0])) {
			placeholder = placeholder_map.get(parts[0])!
		} else {
			placeholder = prompt.length
			placeholder_map.set(parts[0], placeholder)
			prompt.push({ text: parts[0], sourceLanguage: parts[1], targetLanguage: parts[2] })
		}
		text = text.substring(0, openerIndex) + placeholderOpener + placeholder + placeholderCloser + text.substring(closerIndex + translationCloser.length, text.length)
	}

	if (!prompt.length) {
		return obj
	}
	
	const response = await ai.models.generateContent({
		model: 'gemini-3.5-flash',
		contents: JSON.stringify(prompt),
		config: {
			temperature: 0.0,
			seed: 41,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0,
			systemInstruction: translate_prompt,
			responseMimeType: 'application/json',
			responseJsonSchema: {
				type: 'array',
				items: {
					type: 'string',
				}
			},
		}
	})

	const substitutions = response.text ? JSON.parse(response.text) : []
	for (let i = 0; i < substitutions.length; ++i) {
		text = text.replaceAll(`${placeholderOpener}${i}${placeholderCloser}`, substitutions[i].replaceAll('\"', '\\\"'))
	}

	return JSON.parse(text)
}

// main

async function get_brief_data(input: BriefInput, ai: GoogleGenAI): Promise<BriefOutput | undefined> {
	const tnnBasedInfo = await get_tnn_based_info(input, ai)
	if (!tnnBasedInfo) {
		return undefined
	}
	return {
		verse: input.verse,
		lwc: input.lwc,
		rigor: input.rigor,
		tnnPromptVersion: 'v11',
		outputStyle: input.output_style,
		section1: {
			flagNotes: input.notes,
		},
		section2: {
			lwcText: input.lwc_text,
		},
		section3: {
			notes: input.notes.map(note => ({
				name: note.trigger.name,
				lwcSpan: note.quoted_text,
				text: `${note.meaning} ${note.check}`,
			})),
		},
		...tnnBasedInfo,
	}
}

function convert_to_usfm(verse_ref: VerseReference, output: BriefOutput): string {
	if (!output) {
		return `\\v ${verse_ref.verse} Unexpected issue getting notes for this verse...`
	}

	const items: string[] = []

	items.push(`\\v ${verse_ref.verse} ${output.section2.lwcText}`)

	// Copilot notes
	items.push(`\\s ${mark_for_translation('TaBiThA SEMANTIC NOTES', output.lwc)}`)
	for (const note of output.section3.notes) {
		const lwc_span = note.lwcSpan ? `"${note.lwcSpan}" — ` : ''
		items.push(`\\iex ${lwc_span}(${mark_for_translation(note.name, output.lwc)}) ${note.text}`)
	}
	if (output.section3.notes.length === 0) {
		items.push(`\\iex ${lwc_info[output.lwc]?.no_notes_text ?? mark_for_translation(lwc_info['English']?.no_notes_text!, output.lwc)}`)
	}

	// TNN notes
	if (output.section4.notes.length > 0) {
		items.push(`\\s ${mark_for_translation('SIL TRANSLATOR NOTES', output.lwc)}`)
		for (const tnn_note of output.section4.notes) {
			items.push(`\\iex ${mark_for_translation(tnn_note.text, output.lwc)}`)
		}
	}

	// Cultural & background
	if (output.section5.cultural.length || output.section5.background.length) {
		items.push(`\\s ${mark_for_translation('CULTURAL & CONTEXTUAL BACKGROUND', output.lwc)}`)
		for (const { term, summary } of output.section5.cultural) {
			items.push(`\\iex ${mark_for_translation(term, output.lwc)} — ${mark_for_translation(summary, output.lwc)}`)
		}
		for (const { term, summary } of output.section5.background) {
			items.push(`\\iex ${mark_for_translation(term, output.lwc)} — ${mark_for_translation(summary, output.lwc)}`)
		}
	}

	// Image keywords
	if (output.section6.keywords.length) {
		items.push(`\\s ${mark_for_translation('IMAGE KEYWORDS', output.lwc)}`)
		for (const keyword of output.section6.keywords) {
			items.push(`\\iex ${mark_for_translation(keyword, output.lwc)}`)
		}
	}

	// Consultant decisions
	if (output.section7.decisions.length) {
		items.push(`\\s ${mark_for_translation('CONSULTANT DECISION', output.lwc)}`)
		for (const decision of output.section7.decisions) {
			items.push(`\\iex ${mark_for_translation(decision.status, output.lwc)} — ${mark_for_translation(decision.text, output.lwc)}`)
		}
	}

	return items.join('\n')
}

async function convert_to_docx(verse_ref: VerseReference, output: BriefOutput, ai: GoogleGenAI) {
	// TODO fully implement this - this is currently here to keep the pre-existing conversion to this template data
	const readerLanguage = output.lwc
	const template_data: BriefDocxTemplateData = await translate_json({
		verseReference: verse_ref,
		passageReference: `${verse_ref.book} ${verse_ref.chapter}:${verse_ref.verse}`,
		promptVersion: output.tnnPromptVersion,
		pagePreamble: mark_for_translation('page', readerLanguage),
		rigorMode: output.rigor,
		lwcName: mark_for_translation(output.lwc, readerLanguage),
		flagsHeading: mark_for_translation('PROVENANCE FLAGS', readerLanguage),
		flagNotes: output.section1.flagNotes.flatMap(question =>
			question.trigger.flags.map(flag => ({
				title: question.trigger.name,
				weight: format_weight(question.trigger.weight),
				trace: `node ${question.trigger.node_id}  ·  ${flag.encoding_anchor.category}  ·  concept: ${flag.encoding_anchor.concept}  ·  index ${flag.encoding_anchor.noun_index}  ·  value: ${flag.value}`,
				lwcText: `${question.meaning} ${question.check}`,
				btText: mark_for_translation(`${question.meaning} ${question.check}`, 'English', output.lwc)
			}))
		),
		sourceHeading: mark_for_translation('TBTA LWC VERSE', readerLanguage),
		sourceBody: output.section2.lwcText,
		notesHeading: mark_for_translation('TaBiThA SEMANTIC NOTES', readerLanguage),
		notes: output.section1.flagNotes.map((question, index) => ({
			ordinal: index + 1,
			name: mark_for_translation(question.trigger.name, readerLanguage),
			text: question.meaning + ' ' + question.check
		})),
		tnnHeading: mark_for_translation('SIL TRANSLATOR NOTES', readerLanguage),
		tnnTraces: output.section4.sourcePointabilityRows.filter(row => row.verdict.type != 'RETAIN').map(row => ({
			note: row.note,
			function: row.function,
			lwcSpan1: row.lwcSpan != 'NOT IN LWC' ? `“${row.lwcSpan}”` : '',
			lwcSpan2: row.lwcSpan == 'NOT IN LWC' ? row.lwcSpan : '',
			verdict1: row.verdict.type == 'CUT' ? format_verdict(row.verdict) : '',
			verdict2: !(row.verdict.type == 'CUT' || row.verdict.type == 'SECTION 5') ? format_verdict(row.verdict) : '',
			verdict3: row.verdict.type == 'SECTION 5' ? format_verdict(row.verdict) : '',
		})),
		retainedNone: output.section4.sourcePointabilityRows.filter(row => row.verdict.type == 'RETAIN').length == 0,
		retainedNoneText: mark_for_translation('No mechanics notes were retained for this passage.', readerLanguage),
		retainedNotes: output.section4.notes.map(row => ({
			text: mark_for_translation(row.text, readerLanguage)
		})),
		excludedNotes: output.section4.excluded.map(row => ({
			text: `${row.note}: ${row.reason}`
		})),
		contextHeading: mark_for_translation('CULTURAL & CONTEXTUAL BACKGROUND', readerLanguage),
		contextNotesCulturalHeading: mark_for_translation('Cultural', readerLanguage),
		contextNotesCultural: output.section5.cultural.map(row => ({
			title: mark_for_translation(row.term, readerLanguage),
			text: mark_for_translation(row.summary, readerLanguage)
		})),
		contextNotesBackgroundHeading: mark_for_translation('Background', readerLanguage),
		contextNotesBackground: output.section5.background.map(row => ({
			title: mark_for_translation(row.term, readerLanguage),
			text: mark_for_translation(row.summary, readerLanguage)
		})),
		imagesHeading: mark_for_translation('IMAGE KEYWORDS', readerLanguage),
		imageNotes: output.section6.keywords.map(keyword => ({
			title: keyword
		})),
		consultantHeading: mark_for_translation('CONSULTANT DECISION', readerLanguage),
		consultantNotes: output.section7.decisions.length == 0 ? [{ text: mark_for_translation('No Section 7 candidate was identified.', readerLanguage) }] : output.section7.decisions.map(decision => ({
			text: `${mark_for_translation(decision.status, readerLanguage)} — ${mark_for_translation(decision.text, readerLanguage)}`
		}))
	}, ai)

	// TODO fill in the template with the above data
}

export async function create_brief_for_chapter(chapter_ref: ChapterReference, settings: BriefSettings, ai: GoogleGenAI) {
	const last_verse = await fetch_verses_for_chapter(chapter_ref)
	if (!last_verse) {
		console.error(`Error fetching verses for ${chapter_ref.book} ${chapter_ref.chapter}`)
		throw Error('Chapter reference does not exist')
	}

	const all_verses = Array.from({ length: last_verse }, (_, i) => i + 1)

	const results: [VerseReference, BriefOutput][] = await map_concurrent(all_verses, 5, async (verse) => {
		const verse_ref = { ...chapter_ref, verse }
		let result = await create_brief_for_verse(verse_ref, settings, ai)
		// if there was an error, try one more time. the error itself is logged elsewhere
		if (!result) {
			result = await create_brief_for_verse(verse_ref, settings, ai)
		}
		return [verse_ref, result!]
	})

	if (settings.output_format === 'usfm' && settings.output_style === 'production') {
		const usfm_lines = [
			`\\id ${usfm_book_codes[chapter_ref.book] || chapter_ref.book}`,
			`\\c ${chapter_ref.chapter}`,
			...results.map(([verse_ref, result]) => convert_to_usfm(verse_ref, result)),
		]
		return (await translate_json(usfm_lines, ai)).join('\n')

	} else {
		return undefined
	}
}

export async function create_brief_for_verse(verse_ref: VerseReference, settings: BriefSettings, ai: GoogleGenAI): Promise<BriefOutput | undefined> {
	const note_results = await get_copilot_result(verse_ref, settings, ai)
	if (note_results.error) {
		// the error is already logged elsewhere
		return undefined
	}

	const brief_input: BriefInput = {
		verse: verse_ref,
		lwc: settings.lwc,
		rigor: settings.rigor,
		output_format: settings.output_format,
		output_style: settings.output_style,
		lwc_text: note_results.lwc_text || note_results.english_text,
		notes: note_results.notes,
	}
	return get_brief_data(brief_input, ai)
}

async function map_concurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = new Array(items.length)
	for (let i = 0; i < items.length; i += limit) {
		const chunk = items.slice(i, i + limit)
		const chunk_results = await Promise.all(chunk.map((item, idx) => fn(item).then(res => [i + idx, res] as const)))
		for (const [idx, res] of chunk_results) {
			results[idx] = res
		}
	}
	return results
}