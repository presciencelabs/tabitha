import { json } from '@sveltejs/kit'
import { get_simplification_hints } from '$lib/server/ontology'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db } }) {
	const complex_term = searchParams.get('complex_term') ?? ''

	const matches = await get_simplification_hints(db)(complex_term)

	return json(matches)
}