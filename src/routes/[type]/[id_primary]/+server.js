// https://kit.svelte.dev/docs/routing#server
import { get_secondary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary } }) {
	const results = await get_secondary_ids(db, type, id_primary)
	return json(results)
}
