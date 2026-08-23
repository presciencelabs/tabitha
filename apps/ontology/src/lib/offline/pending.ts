import { get_all_mutations, type QueuedMutation } from './queue'
import type { Concept, ConceptKey, OntologyChange, OntologyChangeDataFields } from '$lib/types'
import type { ConceptUpdateData } from '$lib/server/types'

const DIFFED_FIELDS = ['level', 'gloss', 'brief_gloss', 'categories', 'curated_examples'] as const

export function do_concepts_match(a: ConceptKey, b: ConceptKey): boolean {
	return a.stem === b.stem && a.sense === b.sense && a.part_of_speech === b.part_of_speech
}

// The update form's categories can be a fixed-length array with '' placeholders for unfilled
// theta-grid slots (see decode_categorization_for_update in server/changes/concepts.ts), while a
// search-listing concept's categories are the compact form -- normalize both before comparing so
// that placeholder padding alone doesn't read as a change the user never made.
function normalize_categories(categories: string[] | undefined): string {
	return (categories ?? []).filter(Boolean).sort().join(',')
}

// Mirrors the server's diff_change_data (changes.ts), but against the concept already in hand
// client-side rather than a fresh DB fetch.
function diff(body: ConceptUpdateData, concept: Concept): OntologyChangeDataFields {
	const current: Record<string, unknown> = { ...concept, curated_examples: concept.curated_examples_raw }

	return Object.fromEntries(
		DIFFED_FIELDS.flatMap(field => {
			const old = current[field]
			const value = body[field]
			const changed = field === 'categories'
				? normalize_categories(old as string[] | undefined) !== normalize_categories(value as string[] | undefined)
				: old?.toString() !== value?.toString()
			return changed ? [[field, { old, value }]] : []
		}),
	)
}

function to_change(mutation: QueuedMutation, concept: Concept): OntologyChange {
	const body = mutation.body as ConceptUpdateData
	return {
		id: -1,
		concept: { stem: body.stem, sense: body.sense, part_of_speech: body.part_of_speech },
		data: diff(body, concept),
		action: mutation.action,
		approved_by: null,
		applied_date: null,
		version: null,
		is_unsynced: true,
	}
}

// Enriches search results with edits still sitting in this browser's offline queue -- the server
// has no way to know about these since they haven't been sent yet, so this can only happen client-side.
export async function merge_pending_changes(concepts: Concept[]): Promise<Concept[]> {
	const mutations = (await get_all_mutations()).filter(mutation => mutation.action === 'update')
	if (!mutations.length) return concepts

	return concepts.map(concept => {
		const mutation = mutations.find(mutation => do_concepts_match(mutation.body, concept))
		return mutation
			? { ...concept, pending_changes: [...concept.pending_changes, to_change(mutation, concept)] }
			: concept
	})
}

// Finds a still-queued edit for one specific concept, e.g. to restore it when reopening its update page.
export async function check_for_pending_change(a_concept: ConceptKey): Promise<QueuedMutation | undefined> {
	const mutations = await get_all_mutations()
	return mutations.find(mutation => mutation.action === 'update' && do_concepts_match(mutation.body, a_concept))
}
