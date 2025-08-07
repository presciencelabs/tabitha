// https://kit.svelte.dev/docs/routing#server
import { get_primary_ids } from '$lib/data/read'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type } }) {
	const results = await get_primary_ids(db, type)
	return json(results)
}
