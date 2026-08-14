import { get_semantic_notes } from '$lib/server/semantic_notes'
import { default_target_audience, fetch_encoding, fetch_target_text, lwc_info } from '$lib/lookups'
import { extract_flags } from './flag_extraction/flag_extraction'
import { assign_flag_weights } from './flag_weighting/flag_weighting'
import { collect_triggers, triggers_match } from './triggers'
import type { GoogleGenAI } from '@google/genai/node'

export async function get_copilot_result(reference: VerseReference, settings: CopilotSettings, ai: GoogleGenAI): Promise<CopilotApiResult> {
	const ref_display = `${reference.book} ${reference.chapter}:${reference.verse}`

	const encoding = await fetch_encoding(reference)
	if (!encoding) {
		console.error(`Error fetching encoding for ${reference.book} ${reference.chapter}:${reference.verse}`)
		return error_result(reference, `Verse reference ${ref_display} does not exist`)
	}

	const english = await fetch_target_text(reference, 'English', default_target_audience['English'])
	if (!english) {
		console.error(`Error fetching english text for ${ref_display}`)
		return error_result(reference, 'There is no English text saved yet for this verse.')
	}
	const english_text = english.ideal || english.text

	const lwc_text_result = settings.lwc !== 'English'
		? await fetch_target_text(reference, settings.lwc, default_target_audience[settings.lwc] || 'Unchurched Adults')
		: english

	if (!lwc_text_result) {
		console.error(`Error fetching ${settings.lwc} text for ${ref_display}`)
		return error_result(reference, `There is no ${settings.lwc} text saved yet for this verse.`)
	}
	const lwc_text = lwc_text_result.ideal || lwc_text_result.text

	const flags = extract_flags(encoding.encoding)
	const weighted_flags = assign_flag_weights(flags, settings).filter(({ weight }) => weight > 0)
	const all_triggers = collect_triggers(weighted_flags, settings.language_profile)
	const sorted_triggers = all_triggers.toSorted((t1, t2) => t1.node_id.localeCompare(t2.node_id))

	const sensitivity = Number(settings.sensitivity)	// in case it somehow gets converted to a string somewhere
	const selected_triggers = sorted_triggers.filter(t => t.weight >= sensitivity)

	const llm_input: CopilotLlmInput = {
		verse: `${reference.book} ${reference.chapter}:${reference.verse}`,
		output_language: settings.lwc ?? 'English',
		prose_level: settings.mtt_level,
		tbta_encoding: preprocess_encoding(encoding),
		english_text,
		lwc_text: settings.lwc === 'English' ? undefined : lwc_text,
		triggers: selected_triggers,
	}

	try {
		const llm_output = await get_semantic_notes(llm_input, ai)
		const notes = llm_output.notes.map(({ meaning, check, quoted_text, trigger }) =>
			({ meaning, check, quoted_text, trigger: llm_input.triggers.find(trigger_data => triggers_match(trigger, trigger_data))! }),
		)
		return {
			verse: reference,
			english_text,
			lwc_text: llm_output.lwc_text,
			notes,
		}

	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error fetching notes from LLM for ${ref_display}:`, error.message)
			return error_result(reference, `Error encountered calling the LLM - ${error.message}`)
		} else {
			console.error(`Error fetching notes from LLM for ${ref_display}:`, error)
			return error_result(reference, `Error encountered calling the LLM - ${error}`)
		}
	}
}

export function error_result(reference: VerseReference, message: string) {
	return {
		verse: reference,
		error: message,
		english_text: '',
		notes: [],
	}
}

export function convert_to_usfm_for_discern(lwc: string): (result: CopilotApiResult) => string {
	const no_suggestions_text = lwc_info[lwc].no_notes_text || lwc_info['English'].no_notes_text
	return result => {
		if (result.error) {
			return `\\p \\v ${result.verse.verse} Unexpected error loading notes for this verse. Contact an administrator.`
		}

		// Convert the results to Paratext SFM format:
		//   \p \v [verse number] TBTA English
		//   \p Second language (if present)
		//   \li First suggestion
		//   \li Second suggestion...
		const notes = result.notes.length ? result.notes.map(({ meaning, check }) => `${meaning} ${check}`) : [no_suggestions_text]
		return [
			`\\p \\v ${result.verse.verse} ${result.english_text}`,
			...result.lwc_text ? [`\\p ${result.lwc_text}`] : [],
			...notes.map(c => `\\li - ${c}`),
		].join('\n')
	}
}

function preprocess_encoding(encoding: SourceApiResult): string {
	const encoding_w_ids: SourceApiResult = {
		encoding: add_node_ids(encoding.encoding),
		glosses: encoding.glosses,
	}
	return JSON.stringify(encoding_w_ids)
		.replaceAll('"be-G"', '"be-for-G"')
		.replaceAll('"be-I"', '"be-with-I"')
		.replaceAll('"be-P"', '"be-about-P"')
		.replaceAll('"be-Q"', '"be-made-of-Q"')
		.replaceAll('"be-R"', '"be-part-of-R"')
		.replaceAll('"be-T"', '"be-from-T"')
		.replaceAll('"be-U"', '"be-like-U"')
		.replaceAll('"be-W"', '"be-in-W"')
		.replaceAll('"become-G"', '"become-like-G"')
}

function add_node_ids(encoding: EncodingEntity[]): EncodingEntity[] {
	const stack: IndexStack = []
	function add_trace(node: EncodingEntity, index: number): EncodingEntity {
		stack.push(index)
		const node_id = stack.join('.')
		if (node.children) {
			node.children = node.children.map(add_trace)
		}
		stack.pop()
		return { ...node, node_id }
	}
	return encoding.map(add_trace)
}