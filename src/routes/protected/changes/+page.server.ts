import { get_all_changes, get_pending_changes } from '$lib/server/changes/changes.js'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { db_ontology }, url: { searchParams } }) {
	const status = searchParams.get('status') ?? 'all'

	const changes = status === 'pending'
		? await get_pending_changes(db_ontology)
		: await get_all_changes(db_ontology)

	return {
		changes,
	}
}
