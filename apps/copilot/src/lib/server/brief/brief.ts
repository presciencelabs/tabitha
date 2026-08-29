import { env } from '$env/dynamic/private'
import { lwc_info, usfm_book_codes } from '$lib/lookups'
import { AiResponseError, check_input_safety, type AiClient } from '@tabitha/ai'
import { brief_main_prompt, translate_prompt } from './prompts'
import { json_response_schema } from './json_response_schema'

// The AI Gateway's prompt-injection guardrail is off gateway-wide (see @tabitha/ai's input_guard
// and ADR 0007), so this is a local, best-effort substitute scoped to the third-party content
// fetched here: SIL's Open Translators Notes from the Aquifer API. Unlike a TaBiThA-user-authored
// verse, this is untrusted external text (a compromised/malicious API response, not a malicious
// teammate), so the cap is generous -- a full notes document, not a single verse.
const MAX_TNN_TEXT_LENGTH = 20000

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

async function get_tnn_based_info({ input, ai }: { input: BriefInput, ai: AiClient }): Promise<BriefTnnBasedOutput | undefined> {
	// get prompt from Aquifer
	const contentId = (await get_aquifer_content_ids(input.verse))[0]

	const aquifer_response = await fetch(`https://api.aquifer.bible/resources/${contentId}`, {
		headers: {
			'api-key': env.API_KEY_AQUIFER,
		},
	})

	if (!aquifer_response.ok) {
		console.error(`HTTP error: received response of status ${aquifer_response.status} (${aquifer_response.statusText}) from ${aquifer_response.url}`)
		return undefined
	}
	const tnn_text = await aquifer_response.text()
	const safety_issue = check_input_safety(tnn_text, {
		max_length: MAX_TNN_TEXT_LENGTH,
		too_long_message: `TNN text is too long (${tnn_text.length} characters, max ${MAX_TNN_TEXT_LENGTH}).`,
		suspicious_message: 'TNN text looks like it might contain instructions rather than translator notes.',
		log_label: 'copilot: brief (tnn)',
	})
	if (safety_issue) {
		console.warn(`copilot: brief rejected Aquifer TNN content for content ID ${contentId}: ${safety_issue}`)
		return undefined
	}

	const prompt = {
		verseReference: `${input.verse.book} ${input.verse.chapter}:${input.verse.verse}`,
		rigorMode: input.rigor,
		tnnText: tnn_text,
		lwcVerse: input.lwc_text,
		tabithaNotes: input.notes,
	}

	try {
		return await ai.generate_json<BriefTnnBasedOutput>({
			contents: prompt,
			system_instruction: brief_main_prompt,
			schema: json_response_schema,
		})
	} catch (error) {
		if (!(error instanceof AiResponseError)) throw error
		console.error(`Gemini error: ${error.message}`)
		return undefined
	}
}

// convert_to_docx and its helpers (format_weight, format_verdict) are disabled: they build a
// translated template_data object but never actually render a .docx (no docx library or
// template exists yet), and nothing currently calls this function. Kept for reference rather
// than deleted, since it's meant to become the real docx export path eventually -- see issue #36.
//
// function format_weight(weight: number) {
// 	const max = 5
// 	return `${'●'.repeat(weight)}${'○'.repeat(max - weight)}`
// }
//
// function format_verdict(verdict: { type: string, subtype?: string | null, reason?: string | null }) {
// 	switch (verdict.type) {
// 		case 'SECTION 5':
// 			return `→ SECTION 5 (${verdict.subtype})`
// 		case 'SOLVED':
// 			return `SOLVED — ${verdict.reason}`
// 		case 'CUT':
// 			return `CUT (${verdict.subtype} — ${verdict.reason})`
// 		default:
// 			return verdict.type
// 	}
// }

const translation_opener = '[['
const translation_delimiter = '||'
const translation_closer = ']]'
const placeholder_opener = '{{'
const placeholder_closer = '}}'

function mark_for_translation({ text, targetLanguageName, sourceLanguageName = 'English' }: { text: string, targetLanguageName: string, sourceLanguageName?: string }): string {
	return sourceLanguageName !== targetLanguageName ? `${translation_opener}${text}${translation_delimiter}${sourceLanguageName}${translation_delimiter}${targetLanguageName}${translation_closer}` : text
}

export async function translate_json<T>({ obj, ai }: { obj: T, ai: AiClient }): Promise<T> {
	const placeholder_map = new Map<string, number>()

	// TODO use Regex?
	const prompt = []
	let text = JSON.stringify(obj)
	while (true) {
		const opener_index = text.indexOf(translation_opener)
		if (opener_index === -1)
			break
		const closer_index = text.indexOf(translation_closer, opener_index + translation_opener.length)
		const [translation_text, source_language, target_language] = text.substring(opener_index + translation_opener.length, closer_index).split(translation_delimiter)

		let placeholder = placeholder_map.get(translation_text)
		if (placeholder === undefined) {
			placeholder = prompt.length
			placeholder_map.set(translation_text, placeholder)
			prompt.push({ text: translation_text, sourceLanguage: source_language, targetLanguage: target_language })
		}
		text = `${text.slice(0, opener_index)}${placeholder_opener}${placeholder}${placeholder_closer}${text.slice(closer_index + translation_closer.length)}`
	}

	if (!prompt.length) {
		return obj
	}
	
	let substitutions: string[]
	try {
		substitutions = await ai.generate_json<string[]>({
			contents: prompt,
			system_instruction: translate_prompt,
			schema: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
		})
	} catch (error) {
		if (!(error instanceof AiResponseError)) throw error
		substitutions = []
	}

	for (const [i, substitution] of substitutions.entries()) {
		text = text.replaceAll(`${placeholder_opener}${i}${placeholder_closer}`, substitution.replaceAll('"', '\\"'))
	}

	return JSON.parse(text)
}

// main

export async function create_brief_for_verse({ note_results, settings, ai }: { note_results: CopilotApiResult, settings: BriefSettings, ai: AiClient }): Promise<BriefOutput | undefined> {
	if (note_results.error) {
		// the error is already logged elsewhere
		return undefined
	}

	const brief_input: BriefInput = {
		verse: note_results.verse,
		lwc: settings.lwc,
		rigor: settings.rigor,
		output_format: settings.output_format,
		output_style: settings.output_style,
		lwc_text: note_results.lwc_text || note_results.english_text,
		notes: note_results.notes,
	}
	return get_brief_data({ input: brief_input, ai })
}

async function get_brief_data({ input, ai }: { input: BriefInput, ai: AiClient }): Promise<BriefOutput | undefined> {
	const tnn_based_info = await get_tnn_based_info({ input, ai })
	if (!tnn_based_info) {
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
		...tnn_based_info,
	}
}

export function convert_to_usfm_for_brief({ verse_ref, output }: { verse_ref: VerseReference, output: BriefOutput | undefined }): string {
	if (!output) {
		return `\\v ${verse_ref.verse} Unexpected issue getting notes for this verse...`
	}

	const items: string[] = []

	items.push(`\\v ${verse_ref.verse} ${output.section2.lwcText}`)

	// Copilot notes
	items.push(`\\s ${mark_for_translation({ text: 'TaBiThA SEMANTIC NOTES', targetLanguageName: output.lwc })}`)
	for (const note of output.section3.notes) {
		const lwc_span = note.lwcSpan ? `"${note.lwcSpan}" — ` : ''
		items.push(`\\iex ${lwc_span}(${mark_for_translation({ text: note.name, targetLanguageName: output.lwc })}) ${note.text}`)
	}
	if (output.section3.notes.length === 0) {
		items.push(`\\iex ${lwc_info[output.lwc]?.no_notes_text ?? mark_for_translation({ text: lwc_info['English']?.no_notes_text ?? '', targetLanguageName: output.lwc })}`)
	}

	// TNN notes
	if (output.section4.notes.length > 0) {
		items.push(`\\s ${mark_for_translation({ text: 'SIL TRANSLATOR NOTES', targetLanguageName: output.lwc })}`)
		for (const tnn_note of output.section4.notes) {
			items.push(`\\iex ${mark_for_translation({ text: tnn_note.text, targetLanguageName: output.lwc })}`)
		}
	}

	// Cultural & background
	if (output.section5.cultural.length || output.section5.background.length) {
		items.push(`\\s ${mark_for_translation({ text: 'CULTURAL & CONTEXTUAL BACKGROUND', targetLanguageName: output.lwc })}`)
		for (const { term, summary } of output.section5.cultural) {
			items.push(`\\iex ${mark_for_translation({ text: term, targetLanguageName: output.lwc })} — ${mark_for_translation({ text: summary, targetLanguageName: output.lwc })}`)
		}
		for (const { term, summary } of output.section5.background) {
			items.push(`\\iex ${mark_for_translation({ text: term, targetLanguageName: output.lwc })} — ${mark_for_translation({ text: summary, targetLanguageName: output.lwc })}`)
		}
	}

	// Image keywords
	if (output.section6.keywords.length) {
		items.push(`\\s ${mark_for_translation({ text: 'IMAGE KEYWORDS', targetLanguageName: output.lwc })}`)
		for (const keyword of output.section6.keywords) {
			items.push(`\\iex ${mark_for_translation({ text: keyword, targetLanguageName: output.lwc })}`)
		}
	}

	// Consultant decisions
	if (output.section7.decisions.length) {
		items.push(`\\s ${mark_for_translation({ text: 'CONSULTANT DECISION', targetLanguageName: output.lwc })}`)
		for (const decision of output.section7.decisions) {
			items.push(`\\iex ${mark_for_translation({ text: decision.status, targetLanguageName: output.lwc })} — ${mark_for_translation({ text: decision.text, targetLanguageName: output.lwc })}`)
		}
	}

	return items.join('\n')
}

// export async function convert_to_docx({ verse_ref, output, ai }: { verse_ref: VerseReference, output: BriefOutput, ai: AiClient }) {
// 	// TODO fully implement this - this is currently here to keep the pre-existing conversion to this template data
// 	const reader_language = output.lwc
// 	const template_data: BriefDocxTemplateData = await translate_json({
// 		obj: {
// 			verseReference: verse_ref,
// 			passageReference: `${verse_ref.book} ${verse_ref.chapter}:${verse_ref.verse}`,
// 			promptVersion: output.tnnPromptVersion,
// 			pagePreamble: mark_for_translation({ text: 'page', targetLanguageName: reader_language }),
// 			rigorMode: output.rigor,
// 			lwcName: mark_for_translation({ text: output.lwc, targetLanguageName: reader_language }),
// 			flagsHeading: mark_for_translation({ text: 'PROVENANCE FLAGS', targetLanguageName: reader_language }),
// 			flagNotes: output.section1.flagNotes.flatMap(question =>
// 				question.trigger.flags.map(flag => ({
// 					title: question.trigger.name,
// 					weight: format_weight(question.trigger.weight),
// 					trace: `node ${question.trigger.node_id}  ·  ${flag.encoding_anchor.category}  ·  concept: ${flag.encoding_anchor.concept}  ·  index ${flag.encoding_anchor.noun_index}  ·  value: ${flag.value}`,
// 					lwcText: `${question.meaning} ${question.check}`,
// 					btText: mark_for_translation({ text: `${question.meaning} ${question.check}`, targetLanguageName: 'English', sourceLanguageName: output.lwc }),
// 				})),
// 			),
// 			sourceHeading: mark_for_translation({ text: 'TBTA LWC VERSE', targetLanguageName: reader_language }),
// 			sourceBody: output.section2.lwcText,
// 			notesHeading: mark_for_translation({ text: 'TaBiThA SEMANTIC NOTES', targetLanguageName: reader_language }),
// 			notes: output.section1.flagNotes.map((question, index) => ({
// 				ordinal: index + 1,
// 				name: mark_for_translation({ text: question.trigger.name, targetLanguageName: reader_language }),
// 				text: `${question.meaning} ${question.check}`,
// 			})),
// 			tnnHeading: mark_for_translation({ text: 'SIL TRANSLATOR NOTES', targetLanguageName: reader_language }),
// 			tnnTraces: output.section4.sourcePointabilityRows.filter(row => row.verdict.type !== 'RETAIN').map(row => ({
// 				note: row.note,
// 				function: row.function,
// 				lwcSpan1: row.lwcSpan !== 'NOT IN LWC' ? `"${row.lwcSpan}"` : '',
// 				lwcSpan2: row.lwcSpan === 'NOT IN LWC' ? row.lwcSpan : '',
// 				verdict1: row.verdict.type === 'CUT' ? format_verdict(row.verdict) : '',
// 				verdict2: !(row.verdict.type === 'CUT' || row.verdict.type === 'SECTION 5') ? format_verdict(row.verdict) : '',
// 				verdict3: row.verdict.type === 'SECTION 5' ? format_verdict(row.verdict) : '',
// 			})),
// 			retainedNone: output.section4.sourcePointabilityRows.filter(row => row.verdict.type === 'RETAIN').length === 0,
// 			retainedNoneText: mark_for_translation({ text: 'No mechanics notes were retained for this passage.', targetLanguageName: reader_language }),
// 			retainedNotes: output.section4.notes.map(row => ({
// 				text: mark_for_translation({ text: row.text, targetLanguageName: reader_language }),
// 			})),
// 			excludedNotes: output.section4.excluded.map(row => ({
// 				text: `${row.note}: ${row.reason}`,
// 			})),
// 			contextHeading: mark_for_translation({ text: 'CULTURAL & CONTEXTUAL BACKGROUND', targetLanguageName: reader_language }),
// 			contextNotesCulturalHeading: mark_for_translation({ text: 'Cultural', targetLanguageName: reader_language }),
// 			contextNotesCultural: output.section5.cultural.map(row => ({
// 				title: mark_for_translation({ text: row.term, targetLanguageName: reader_language }),
// 				text: mark_for_translation({ text: row.summary, targetLanguageName: reader_language }),
// 			})),
// 			contextNotesBackgroundHeading: mark_for_translation({ text: 'Background', targetLanguageName: reader_language }),
// 			contextNotesBackground: output.section5.background.map(row => ({
// 				title: mark_for_translation({ text: row.term, targetLanguageName: reader_language }),
// 				text: mark_for_translation({ text: row.summary, targetLanguageName: reader_language }),
// 			})),
// 			imagesHeading: mark_for_translation({ text: 'IMAGE KEYWORDS', targetLanguageName: reader_language }),
// 			imageNotes: output.section6.keywords.map(keyword => ({
// 				title: keyword,
// 			})),
// 			consultantHeading: mark_for_translation({ text: 'CONSULTANT DECISION', targetLanguageName: reader_language }),
// 			consultantNotes: output.section7.decisions.length === 0 ? [{ text: mark_for_translation({ text: 'No Section 7 candidate was identified.', targetLanguageName: reader_language }) }] : output.section7.decisions.map(decision => ({
// 				text: `${mark_for_translation({ text: decision.status, targetLanguageName: reader_language })} — ${mark_for_translation({ text: decision.text, targetLanguageName: reader_language })}`,
// 			})),
// 		},
// 		ai,
// 	})
//
// 	return template_data
// }
