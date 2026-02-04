import { is_authorized } from '$lib/server/auth'
import { get_concept_for_update, update_concept } from '$lib/server/changes/concepts.js'
import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, locals }) {
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

/** @satisfies {import('./$types').Actions} */
export const actions = {
	update: async ({ request, locals, url: { searchParams } }) => {
		if (!await is_authorized(locals, 'UPDATE_CONCEPT')) {
			throw error(403, 'You must have permission to update a concept in the Ontology.')
		}

		const concept_key = get_concept_from_url(searchParams)

		const form_data = await request.formData()
		const data: ConceptUpdateData = {
			...concept_key,
			level: form_data.get('level') as string,
			gloss: form_data.get('gloss') as string,
			brief_gloss: form_data.get('brief_gloss') as string,
			categorization: form_data.get('categorization') as string,
			curated_examples: form_data.get('curated_examples') as string,
		}

		await update_concept(locals.db_ontology, data)

		return { success: true }
	},
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

function parse_concept_key(key: string): ConceptKey|null {
	const concept_match = key.match(/^(.+?)-([A-Z])-(.+)$/)
	if (!concept_match) {
		return null
	}
	const [, stem, sense, part_of_speech] = concept_match
	return { stem, sense, part_of_speech }
}
