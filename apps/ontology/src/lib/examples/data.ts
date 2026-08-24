import { PUBLIC_SOURCES_API_HOST, PUBLIC_TARGETS_API_HOST } from '$env/static/public'
import type { Concept, Example, Reference, SourceData, TargetTextResult } from '$lib/types'

export async function get_examples({ stem, sense, part_of_speech }: Concept): Promise<Example[]> {
	const response = await fetch(`/examples?concept=${stem}-${sense}&part_of_speech=${part_of_speech}&source=Bible`)
	return await response.json()
}

export function get_sources_url({ type, id_primary, id_secondary, id_tertiary }: Reference): string {
	return `${PUBLIC_SOURCES_API_HOST}/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
}

export async function get_source_data(reference: Reference): Promise<SourceData> {
	const response = await fetch(get_sources_url(reference))
	return await response.json()
}

export async function get_target_data({ id_primary, id_secondary, id_tertiary }: Reference): Promise<TargetTextResult> {
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/English/${id_primary}/${id_secondary}/${id_tertiary}`)

	// Show the Unchurched Adults if available, because it's usually the most up-to-date.
	// Otherwise, default to the first audience with text
	const texts: TargetTextResult[] = await response.json()
	return (
		texts.find(text => text.audience === 'Unchurched Adults')
		|| texts.find(text => text.text)
		|| { text: '--', audience: 'none saved yet...' }
	)
}
