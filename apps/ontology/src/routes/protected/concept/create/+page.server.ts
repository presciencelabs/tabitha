import { is_authorized } from '$lib/server/auth'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { ConceptCreateData } from '$lib/server/types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!await is_authorized(locals, 'ADD_CONCEPT')) {
		throw error(403, 'You must have permission to add a concept to the Ontology.')
	}

	const concept_data: ConceptCreateData = {
		stem: '',
		sense: '',
		part_of_speech: '',
		level: '0',
		gloss: '',
		brief_gloss: '',
		categories: [],
		curated_examples: '',
	}
	return {
		concept_data,
	}
}
