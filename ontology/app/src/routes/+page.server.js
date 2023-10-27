import {get_all_concepts, get_concepts_by_root} from '$lib/server/ontology'

/** @type {import('./$types').PageServerLoad} */
export async function load({url: {searchParams}, platform}) {
	if (!platform?.env.DB) {
		throw new Error(`database missing from platform arg: ${JSON.stringify(platform)}`)
	}

	const query = (searchParams.get('q') || '').trim()

	const matches = await get_matches(platform.env.DB)(query)

	return {
		matches,
	}
}

/**
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {ConceptFilterFunction}
 */
const get_matches = db => async query => {
	switch (query) {
		case '':
			return []
		case '*':
			return await get_all_concepts(db)
		default:
			return await get_concepts_by_root(db)(query)
	}
}
