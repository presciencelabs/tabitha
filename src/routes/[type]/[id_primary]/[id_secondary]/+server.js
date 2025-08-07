// https://kit.svelte.dev/docs/routing#server
import { get_tertiary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary, id_secondary } }) {
	const results = await get_tertiary_ids(db, type, id_primary, id_secondary)
	return json(results)
}
