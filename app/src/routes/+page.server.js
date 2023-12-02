import {get_concepts} from '$lib/server/ontology'

/** @type {import('./$types').PageServerLoad} */
export async function load({url: {searchParams}, platform}) {
	if (!platform?.env.DB) {
		throw new Error(`database missing from platform arg: ${JSON.stringify(platform)}`)
	}

	const query = (searchParams.get('q') || '').trim()

	const matches = await get_concepts(platform.env.DB)(query)

	return {
		matches,
	}
}
