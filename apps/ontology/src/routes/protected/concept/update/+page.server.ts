import { is_authorized } from '$lib/server/auth'
import { get_concept_for_update } from '$lib/server/changes/concepts'
import { error } from '@sveltejs/kit'
import { parse_concept_key } from '@tabitha/types'
import type { PageServerLoad } from './$types'
import type { ConceptKey } from '$lib/types'

export const load: PageServerLoad = async ({ url: { searchParams }, locals }) => {
	if (!await is_authorized(locals, 'UPDATE_CONCEPT')) {
		throw error(403, 'You must have permission to update a concept in the Ontology.')
	}

	const concept_key = get_concept_from_url(searchParams)

	const concept_data = await get_concept_for_update(locals.db_ontology, concept_key)
	if (!concept_data) {
		throw error(400, 'Specified concept does not exist.')
	}

	return {
		concept_data,
	}
}

function get_concept_from_url(searchParams: URLSearchParams): ConceptKey {
	const concept_param = searchParams.get('concept')
	if (!concept_param) {
		throw error(400, "Missing 'concept' parameter. eg. 'love-A-Verb'")
	}
	const concept_key = parse_concept_key(concept_param)
	if (!concept_key) {
		throw error(400, "Expected 'concept' parameter in the form 'love-A-Verb'")
	}
	return concept_key
}
