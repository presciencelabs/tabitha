import { json } from '@sveltejs/kit'
import { get_simplification_hints } from '$lib/server/ontology'
import type { RequestHandler } from './$types'
import type { ConceptSearchFilter, SimplificationHint } from '$lib/types'

export const GET: RequestHandler = async ({ url: { searchParams }, locals: { db_ontology } }) => {
	const complex_term = searchParams.get('complex_term') ?? ''
	const category = searchParams.get('category') ?? ''

	const concept_filter: ConceptSearchFilter = {
		q: complex_term,
		scope: 'stems',
		category,
	}

	const matches = await get_simplification_hints(db_ontology)(concept_filter)

	return response(matches)

	function response(result: SimplificationHint[]): Response {
		const THREE_HOUR_CACHE = {
			'cache-control': `max-age=${3 * 60 * 60}`,
		}

		return json(result, {
			headers: THREE_HOUR_CACHE,
		})
	}
}
