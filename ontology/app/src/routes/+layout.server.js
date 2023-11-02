import {get_version} from '$lib/server/ontology'

/** @type {import('./$types').LayoutServerLoad} */
export async function load({platform}) {
	if (!platform?.env.DB) {
		throw new Error(`database missing from platform arg: ${JSON.stringify(platform)}`)
	}

	const version = await get_version(platform.env.DB)

	return {
		version,
	}
}
