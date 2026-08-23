import { is_authorized } from '$lib/server/auth'
import { add_change } from '$lib/server/changes/changes'
import { get_concept_for_update } from '$lib/server/changes/concepts'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { ConceptCreateData } from '$lib/server/types'

export const POST: RequestHandler = async ({ request, locals }) => {
	const data: ConceptCreateData = await request.json()

	const existing = await get_concept_for_update(locals.db_ontology, data)
	if (existing) {
		throw error(400, 'A concept with this stem, sense, and part of speech already exists.')
	}

	const can_apply_directly = await is_authorized(locals, 'ADD_CONCEPT')

	let applied: boolean
	try {
		applied = await add_change(locals.db_ontology, 'create', data, locals.user!, can_apply_directly)
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		throw error(500, `Failed to create concept: ${message}`)
	}

	return json({ applied })
}
