import { triggers_match } from '$lib/server/triggers'

export function get_cached_notes(llm_input: CopilotLlmInput): CopilotLlmNote[] {
	const verse_cache = notes_cache_map.get(llm_input.verse)
	if (!verse_cache) {
		return []
	}

	const settings_key = JSON.stringify({ lwc: llm_input.output_language, prose_level: llm_input.prose_level })
	const settings_cache = verse_cache.get(settings_key)
	if (!settings_cache) {
		return []
	}

	return llm_input.triggers.map(trigger => settings_cache.find(cached_note => triggers_match(trigger, cached_note.trigger))).filter(note => !!note)
}

const notes_cache_map: Map<string, Map<string, CopilotLlmNote[]>> = new Map([])