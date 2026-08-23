import { can_approve_change, get_all_changes, get_pending_changes } from '$lib/server/changes/changes.js'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { db_ontology }, url: { searchParams }, parent }) {
	const status = searchParams.get('status') ?? 'all'

	const changes = status === 'pending'
		? await get_pending_changes(db_ontology)
		: await get_all_changes(db_ontology)

	const { can_add, can_update } = await parent()

	return {
		changes: changes.map(change => ({
			...change,
			can_approve: can_approve_change(change, { can_add, can_update }),
		})),
	}
}
