import { get_concepts } from '$lib/server/ontology'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, locals: { db } }) {
	const query = (searchParams.get('q') || '').trim()

	const matches = await get_concepts(db)(query)

	return {
		matches,
	}
}
