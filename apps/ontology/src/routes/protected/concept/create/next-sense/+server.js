import { json } from '@sveltejs/kit'
import { get_next_sense } from '$lib/server/changes/concepts'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db_ontology } }) {
	/** @type {string} */
	const stem = searchParams.get('stem') || ''
	/** @type {string} */
	const part_of_speech = searchParams.get('part_of_speech') || ''

	const next_sense = await get_next_sense(db_ontology, stem, part_of_speech)

	return json({ next_sense })
}
