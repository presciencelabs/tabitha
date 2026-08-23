import { is_authorized } from '$lib/server/auth'
import { approve_change, can_approve_change, get_change } from '$lib/server/changes/changes'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ params, locals }) => {
	const id = Number(params.id)
	const change = await get_change(locals.db_ontology, id)
	if (!change) {
		throw error(404, 'Change not found.')
	}

	const can_add = await is_authorized(locals, 'ADD_CONCEPT')
	const can_update = await is_authorized(locals, 'UPDATE_CONCEPT')
	if (!can_approve_change(change, { can_add, can_update })) {
		throw error(403, `You must have permission to ${change.action === 'create' ? 'add' : 'update'} a concept in the Ontology.`)
	}

	const updated = await approve_change(locals.db_ontology, id, locals.user!)

	return json({ change: { ...updated, can_approve: can_approve_change(updated, { can_add, can_update }) } })
}
