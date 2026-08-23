import type { PageServerLoad } from './$types'
import type { ConceptCreateData } from '$lib/server/types'

// Reaching this page only requires PROTECTED_ACCESS (enforced in hooks.server.ts for all /protected
// routes) -- ADD_CONCEPT is no longer required here, since a user without it can still submit a new
// concept, it just gets recorded as a suggestion instead of applied immediately (see add_change).
export const load: PageServerLoad = async () => {
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
