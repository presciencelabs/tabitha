import { is_authorized } from '$lib/server/auth'
import { add_change } from '$lib/server/changes/changes'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { ConceptUpdateData } from '$lib/server/types'

export const POST: RequestHandler = async ({ request, locals }) => {
	const data: ConceptUpdateData = await request.json()

	const can_apply_directly = await is_authorized(locals, 'UPDATE_CONCEPT')

	let applied: boolean
	try {
		applied = await add_change(locals.db_ontology, 'update', data, locals.user!, can_apply_directly)
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		throw error(500, `Failed to record update: ${message}`)
	}

	return json({ applied })
}
