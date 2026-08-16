import { cached_json } from '@tabitha/api-client'
import { get_concepts } from '$lib/server/ontology'
import type { RequestHandler } from './$types'
import type { Concept, ConceptSearchFilter, SimplificationHint } from '$lib/types'

export const GET: RequestHandler = async ({ url: { searchParams }, locals: { db_ontology } }) => {
	const search_filter: ConceptSearchFilter = {
		q: '',
		scope: 'stems',
		category: '',
		...Object.fromEntries(searchParams),
	}

	const matches = await get_concepts(db_ontology)(search_filter)

	const lite_matches = matches.map(make_lite)

	return cached_json(lite_matches)

	function make_lite(concept: Concept) {
		const { id, stem, sense, part_of_speech, level, gloss, categorization, categories, status, how_to_hints } = concept

		return {
			id,
			stem,
			sense,
			part_of_speech,
			level,
			gloss,
			categorization,
			categories,
			status,
			how_to_hints: how_to_hints.map(make_lite_hints),
		}
	}

	function make_lite_hints(hint: SimplificationHint) {
		const { structure, pairing, explication } = hint
		return { structure, pairing, explication }
	}
}
