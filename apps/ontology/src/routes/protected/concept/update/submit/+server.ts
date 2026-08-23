import { is_authorized } from '$lib/server/auth'
import { add_change } from '$lib/server/changes/changes'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { ConceptUpdateData } from '$lib/server/types'

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!await is_authorized(locals, 'UPDATE_CONCEPT')) {
		throw error(403, 'You must have permission to update a concept in the Ontology.')
	}

	const data: ConceptUpdateData = await request.json()

	let applied: boolean
	try {
		applied = await add_change(locals.db_ontology, 'update', data, locals.user!)
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		throw error(500, `Failed to record update: ${message}`)
	}

	return json({ applied })
}
