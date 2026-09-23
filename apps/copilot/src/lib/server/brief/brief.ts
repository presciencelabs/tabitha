import { env } from '$env/dynamic/private'
import { BRIEF_HEADINGS_ENGLISH } from '$lib/lookups'
import { USFM_BOOK_CODES } from '@tabitha/types/patterns'
import { AiResponseError, check_input_safety, type AiClient } from '@tabitha/ai'
import translate_prompt from './translate_prompt.md?raw'
import brief_main_prompt from './brief_main_prompt.md?raw'
import { json_response_schema } from './json_response_schema'
import type { VerseReference, CopilotBriefResult, CopilotErrorResult, CopilotBriefHeadingsResult } from '@tabitha/types'
import type { BriefInput, BriefTnnBasedOutput } from '$lib/types'
import { CopilotError } from '../copilot_core'

// The AI Gateway's prompt-injection guardrail is off gateway-wide (see @tabitha/ai's input_guard
// and ADR 0007), so this is a local, best-effort substitute scoped to the third-party content
// fetched here: SIL's Open Translators Notes from the Aquifer API. Unlike a TaBiThA-user-authored
// verse, this is untrusted external text (a compromised/malicious API response, not a malicious
// teammate), so the cap is generous -- a full notes document, not a single verse.
const MAX_TNN_TEXT_LENGTH = 20000

// Longer than the AI Gateway's 1-hour default (tools/gateway/config.ts) -- workshop settings
// often re-check or regenerate the same verse's brief well past an hour, and these calls are
// fully deterministic (fixed model/temperature/seed, JSON-schema output, no per-request-unique
// data), so a stale cache entry is never a correctness concern, only a cost one.
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

async function get_aquifer_content_ids(verse: VerseReference): Promise<number[]> {
	const queryParams = new URLSearchParams({
		languageCode: 'eng',
		resourceCollectionCode: 'SILOpenTranslatorsNotes',
		bookCode: USFM_BOOK_CODES[verse.book],
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
		throw new CopilotError(`HTTP error: received response of status ${response.status} (${response.statusText}) from ${response.url}`)
	}

	const result = await response.json() as { items: { id: number }[] }
	return result.items.map(({ id }) => id)
}

async function get_tnn_based_info({ input, ai }: { input: BriefInput, ai: AiClient }): Promise<BriefTnnBasedOutput> {
	// get prompt from Aquifer
	const contentId = (await get_aquifer_content_ids(input.verse))[0]

	const aquifer_response = await fetch(`https://api.aquifer.bible/resources/${contentId}`, {
		headers: {
			'api-key': env.API_KEY_AQUIFER,
		},
	})

	if (!aquifer_response.ok) {
		throw new CopilotError(`HTTP error: received response of status ${aquifer_response.status} (${aquifer_response.statusText}) from ${aquifer_response.url}`)
	}
	const tnn_text = await aquifer_response.text()
	const safety_issue = check_input_safety(tnn_text, {
		max_length: MAX_TNN_TEXT_LENGTH,
		too_long_message: `TNN text is too long (${tnn_text.length} characters, max ${MAX_TNN_TEXT_LENGTH}).`,
		suspicious_message: 'TNN text looks like it might contain instructions rather than translator notes.',
		log_label: 'copilot: brief (tnn)',
	})
	if (safety_issue) {
		const message = `copilot: brief rejected Aquifer TNN content for content ID ${contentId}: ${safety_issue}`
		console.warn(message)
		throw new CopilotError(message)
	}

	const prompt = {
		verseReference: `${input.verse.book} ${input.verse.chapter}:${input.verse.verse}`,
		rigorMode: input.settings.rigor,
		tnnText: tnn_text,
		lwcVerse: input.notes_result.lwc_text,
		tabithaNotes: input.notes_result.notes,
	}

	try {
		return await ai.generate_json<BriefTnnBasedOutput>({
			contents: prompt,
			system_instruction: brief_main_prompt,
			schema: json_response_schema,
			config: {
				httpOptions: { headers: { 'cf-aig-cache-ttl': String(ONE_WEEK_IN_SECONDS) } },
			},
		})
	} catch (error) {
		if (!(error instanceof AiResponseError)) throw error
		throw new CopilotError(`Gemini error: ${error.message}`)
	}
}

const translation_opener = '[['
const translation_delimiter = '||'
const translation_closer = ']]'
const placeholder_opener = '{{'
const placeholder_closer = '}}'

function mark_for_translation({ text, target_language, source_language = 'English' }: { text: string, target_language: string, source_language?: string }): string {
	return source_language !== target_language ? `${translation_opener}${text}${translation_delimiter}${source_language}${translation_delimiter}${target_language}${translation_closer}` : text
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
			config: {
				httpOptions: { headers: { 'cf-aig-cache-ttl': String(ONE_WEEK_IN_SECONDS) } },
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

// The fixed set of section-header labels `convert_to_usfm_for_brief` emits, in English. Unlike
// note text/terms/decisions (unique per verse), these are constant regardless of which verse or
// translator triggered the brief -- routing them through `translate_json` alongside per-verse
// content would defeat the AI Gateway's exact-match cache (mixing them into a body that's
// otherwise different every call, see ADR/cache-TTL comment above). Resolving them once per
// output language, in their own cache-stable request, means every brief after the first for a
// given language is a cache hit for this part instead of a fresh translation.
const STATIC_BRIEF_LABELS = [
	'TaBiThA SEMANTIC NOTES',
	'SIL TRANSLATOR NOTES',
	'CULTURAL & CONTEXTUAL BACKGROUND',
	'IMAGE KEYWORDS',
	'CONSULTANT DECISION',
] as const

export async function get_static_label_translations({ target_language, ai }: { target_language: string, ai: AiClient }): Promise<Record<string, string>> {
	if (target_language === 'English') {
		return Object.fromEntries(STATIC_BRIEF_LABELS.map(label => [label, label]))
	}

	let translations: string[]
	try {
		translations = await ai.generate_json<string[]>({
			contents: STATIC_BRIEF_LABELS.map(text => ({ text, sourceLanguage: 'English', targetLanguage: target_language })),
			system_instruction: translate_prompt,
			schema: {
				type: 'array',
				items: {
					type: 'string',
				},
			},
			config: {
				httpOptions: { headers: { 'cf-aig-cache-ttl': String(ONE_WEEK_IN_SECONDS) } },
			},
		})
	} catch (error) {
		if (!(error instanceof AiResponseError)) throw error
		translations = [...STATIC_BRIEF_LABELS]
	}

	return Object.fromEntries(STATIC_BRIEF_LABELS.map((label, i) => [label, translations[i] ?? label]))
}

// main

export async function create_brief_for_verse({ input, ai }: { input: BriefInput, ai: AiClient }): Promise<CopilotBriefResult | CopilotErrorResult> {
	function to_translate(text: string): string {
		return mark_for_translation({ text, target_language: input.settings.lwc })
	}

	try {
		const tnn_based_info = await get_tnn_based_info({ input, ai })
		return {
			type: 'brief',
			verse: input.verse,
			lwc_text: input.notes_result.lwc_text ?? input.notes_result.english_text,
			semantic_notes: input.notes_result.notes,
			tnn_notes: tnn_based_info.section4.notes.map(note => to_translate(note.text)),
			cultural_background: tnn_based_info.section5.cultural.concat(tnn_based_info.section5.background).map(note => ({
				term: to_translate(note.term),
				summary: to_translate(note.summary),
			})),
			image_keywords: tnn_based_info.section6.keywords.map(keyword => to_translate(keyword)),
			consultant_decisions: tnn_based_info.section7.decisions.map(decision => ({
				status: to_translate(decision.status),
				text: to_translate(decision.text),
			})),
		}
	} catch (error) {
		return {
			type: 'error',
			verse: input.verse,
			error: `Unexpected error occurred: ${(error as any)?.message ?? ''}`,
		}
	}
}

export async function get_brief_headings({ lwc, ai }: { lwc: string, ai: AiClient}): Promise<CopilotBriefHeadingsResult> {
	if (lwc === 'English') {
		return BRIEF_HEADINGS_ENGLISH
	}

	const headings_for_translation: CopilotBriefHeadingsResult = {
		'semantic_notes': mark_for_translation({ text: BRIEF_HEADINGS_ENGLISH.semantic_notes, target_language: lwc }),
		'tnn_notes': mark_for_translation({ text: BRIEF_HEADINGS_ENGLISH.tnn_notes, target_language: lwc }),
		'cultural_background': mark_for_translation({ text: BRIEF_HEADINGS_ENGLISH.cultural_background, target_language: lwc }),
		'image_keywords': mark_for_translation({ text: BRIEF_HEADINGS_ENGLISH.image_keywords, target_language: lwc }),
		'consultant_decisions': mark_for_translation({ text: BRIEF_HEADINGS_ENGLISH.consultant_decisions, target_language: lwc }),
	}

	try {
		return await translate_json({ obj: headings_for_translation, ai })
	} catch (error) {
		console.warn(`Error translating brief headings into ${lwc}. Defaulting to English. '${error}'`)
		return BRIEF_HEADINGS_ENGLISH
	}
}