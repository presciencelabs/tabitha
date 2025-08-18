import { json } from '@sveltejs/kit'
import { get_concepts } from '$lib/server/ontology'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db_ontology } }) {
	/** @type {ConceptSearchFilter} */
	const search_filter = {
		q: '',
		scope: 'stems',
		category: '',
		...Object.fromEntries(searchParams),
	}

	const matches = await get_concepts(db_ontology)(search_filter)

	const lite_matches = matches.map(make_lite)

	return response(lite_matches)

	/** @param {Concept} concept */
	function make_lite(concept) {
		const { id, stem, sense, part_of_speech, level, gloss, categorization, status, how_to_hints } = concept

		return { id, stem, sense, part_of_speech, level, gloss, categorization, status, how_to_hints: how_to_hints.map(make_lite_hints) }
	}

	/** @param {SimplificationHint} hint */
	function make_lite_hints(hint) {
		const { structure, pairing, explication } = hint

		return { structure, pairing, explication }
	}

	/** @param {any} result  */
	function response(result) {
		const THREE_HOUR_CACHE = {
			'cache-control': `max-age=${3 * 60 * 60}`,
		}

		return json(result, {
			headers: THREE_HOUR_CACHE,
		})
	}
}
