import { json } from '@sveltejs/kit'
import { get_concepts } from '$lib/server/ontology'

/** @type {import('./(app)/$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db } }) {
	const query = (searchParams.get('q') || '').trim()

	const matches = await get_concepts(db)(query)

	const lite_matches = matches.map(make_lite)

	return json(lite_matches)

	/**
	 * @param {Concept} concept
	 */
	function make_lite(concept) {
		const { id, stem, sense, part_of_speech, level, gloss, categorization } = concept

		return { id, stem, sense, part_of_speech, level, gloss, categorization }
	}
}