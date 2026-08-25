import { get_all_mutations, type QueuedMutation } from './queue'
import type { Concept, ConceptKey, OntologyChange, OntologyChangeDataFields } from '$lib/types'
import type { ConceptCreateData, ConceptUpdateData } from '$lib/server/types'

const DIFFED_FIELDS = ['level', 'gloss', 'brief_gloss', 'categories', 'curated_examples'] as const

export function do_concepts_match({ a, b }: { a: ConceptKey, b: ConceptKey }): boolean {
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
function diff({ body, concept }: { body: ConceptUpdateData, concept: Concept }): OntologyChangeDataFields {
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

// Mirrors the server's create_change_data (changes.ts) -- a create has no "old" value to diff against.
function create_change_fields(body: ConceptCreateData): OntologyChangeDataFields {
	const { level, gloss, brief_gloss, categories } = body
	return {
		level: { value: level },
		gloss: { value: gloss },
		...brief_gloss ? { brief_gloss: { value: brief_gloss } } : {},
		categories: { value: categories },
	}
}

// concept is only needed (and only available) for an update -- a create has nothing on the server yet to diff against.
function to_change({ mutation, concept }: { mutation: QueuedMutation, concept?: Concept }): OntologyChange {
	const body = mutation.body as ConceptCreateData | ConceptUpdateData
	return {
		id: -1,
		concept: { stem: body.stem, sense: body.sense, part_of_speech: body.part_of_speech },
		data: mutation.action === 'create' ? create_change_fields(body) : diff({ body, concept: concept! }),
		action: mutation.action,
		suggested_by: null,
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
		const mutation = mutations.find(mutation => do_concepts_match({ a: mutation.body, b: concept }))
		return mutation
			? { ...concept, pending_changes: [...concept.pending_changes, to_change({ mutation, concept })] }
			: concept
	})
}

// Finds a still-queued edit for one specific concept, e.g. to restore it when reopening its update page.
export async function check_for_pending_change(a_concept: ConceptKey): Promise<QueuedMutation | undefined> {
	const mutations = await get_all_mutations()
	return mutations.find(mutation => mutation.action === 'update' && do_concepts_match({ a: mutation.body, b: a_concept }))
}

// Queued creates for concepts that don't exist on the server yet -- for the /protected/changes
// audit table, which already knows how to render a 'create' action's field values.
export async function check_for_pending_creates(): Promise<OntologyChange[]> {
	const mutations = (await get_all_mutations()).filter(mutation => mutation.action === 'create')
	return mutations.map(mutation => to_change({ mutation }))
}
