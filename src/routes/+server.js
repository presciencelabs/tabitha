// https://kit.svelte.dev/docs/routing#server
import { get_types } from '$lib/data/read'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db } }) {
	const results = await get_types(db)
	return json(results)
}
