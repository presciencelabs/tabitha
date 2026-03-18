import { get_llm_cautions } from '$lib/server/llm'
import { fetch_encoding, fetch_target_text, lwc_info } from '$lib/lookups'

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

	try {
		const llm_output = await get_llm_cautions(encoding, english_text, settings)
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
		const cautions = result.cautions.length ? result.cautions : [no_suggestions_text]
		return [
			`\\p \\v ${result.verse.verse} ${result.english_text}`,
			...(result.translated_text ? [`\\p ${result.translated_text}`] : []),
			...cautions.map(c => `\\li - ${c}`),
		].join('\n')
	}
}