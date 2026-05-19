import { get_llm_cautions } from '$lib/server/llm'
import { fetch_encoding, fetch_target_text, lwc_info } from '$lib/lookups'
import { extract_flags } from './flag_extraction/flag_extraction'
import { assign_flag_weights } from './flag_weighting/flag_weighting'
import { collect_triggers } from './trigger_filters'

export async function get_copilot_result(reference: Reference, settings: CopilotSettings): Promise<CopilotApiResult> {
	const encoding = await fetch_encoding(reference)
	if (!encoding) {
		console.error(`Error fetching encoding for ${reference}`)
		return error_result(reference, 'Verse reference does not exist')
	}

	console.log(reference)
	const english = await fetch_target_text(reference, 'English', 'Unchurched Adults')
	if (!english) {
		console.error(`Error fetching english text for ${reference}`)
		return error_result(reference)
	}
	const english_text = english.text

	const flags = extract_flags(encoding.encoding)
	const weighted_flags = assign_flag_weights(flags, settings.language_profile).filter(({ weight }) => weight > 0)
	const all_triggers = collect_triggers(weighted_flags)
	const sorted_triggers = all_triggers.toSorted((t1, t2) => t1.weight - t2.weight)

	const threshold = 1
	const max_cautions = settings.max_cautions > 0 ? settings.max_cautions : undefined
	const selected_triggers = sorted_triggers.filter(t => t.weight >= threshold).slice(max_cautions ? -max_cautions : undefined)

	for (const { name, node_id, flags, weight} of sorted_triggers) {
		console.log(`${name} @${node_id} - ${weight}`)
		for (const flag of flags) {
			console.log(`   ${flag.name} - ${flag.value} - ${flag.weight}`)
		}
	}

	const llm_input: CopilotLlmInput = {
		verse: `${reference.book} ${reference.chapter}:${reference.verse}`,
		output_language: settings.lwc ?? 'English',
		prose_level: settings.mtt_level,
		tbta_encoding: preprocess_encoding(encoding),
		english_text: english_text,
		triggers: selected_triggers,
	}

	try {
		const llm_output = await get_llm_cautions(llm_input)
		return {
			verse: reference,
			english_text,
			...llm_output,
		}

	} catch (error) {
		console.error('Error fetching notes from LLM:', error)
		return error_result(reference)
	}
}

export function error_result(reference: Reference, message: string|undefined = undefined) {
	return {
		verse: reference,
		error: message || 'Copilot notes experienced a temporary issue and could not be loaded. Please try again later.',
		english_text: '',
		cautions: [],
	}
}

export function convert_to_sfm(lwc: string): (result: CopilotApiResult) => string {
	const no_suggestions_text = lwc_info[lwc].no_notes_text || lwc_info['English'].no_notes_text
	return result => {
		// Convert the results to Paratext SFM format:
		//   \p \v [verse number] TBTA English
		//   \p Second language (if present)
		//   \li First suggestion
		//   \li Second suggestion...
		const cautions = result.cautions.length ? result.cautions.map(({ note }) => note) : [no_suggestions_text]
		return [
			`\\p \\v ${result.verse.verse} ${result.english_text}`,
			...(result.translated_text ? [`\\p ${result.translated_text}`] : []),
			...cautions.map(c => `\\li - ${c}`),
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
	let stack: IndexStack = []
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