import { is_authorized } from '$lib/server/auth'
import { apply_change_directly, suggest_change } from '$lib/server/changes/changes'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { ConceptUpdateData } from '$lib/server/types'

export const POST: RequestHandler = async ({ request, locals }) => {
	const data: ConceptUpdateData = await request.json()

	const can_apply_directly = await is_authorized({ locals, permission: 'UPDATE_CONCEPT' })
	const submission = { db: locals.db_ontology, action: 'update' as const, data, user: locals.user! }

	let applied: boolean
	try {
		applied = can_apply_directly ? await apply_change_directly(submission) : await suggest_change(submission)
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		throw error(500, `Failed to record update: ${message}`)
	}

	return json({ applied })
}
