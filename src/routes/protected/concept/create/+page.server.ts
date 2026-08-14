import { is_authorized } from '$lib/server/auth'
import { record_create_concept } from '$lib/server/changes/changes'
import { get_concept_for_update } from '$lib/server/changes/concepts'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
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

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!await is_authorized(locals, 'ADD_CONCEPT')) {
			throw error(403, 'You must have permission to add a concept to the Ontology.')
		}

		const form_data = await request.formData()
		const data: ConceptCreateData = {
			stem: form_data.get('stem') as string,
			sense: form_data.get('sense') as string,
			part_of_speech: form_data.get('part_of_speech') as string,
			level: form_data.get('level') as string,
			gloss: form_data.get('gloss') as string,
			brief_gloss: form_data.get('brief_gloss') as string,
			categories: form_data.getAll('categories[]') as string[],
			curated_examples: '',
		}

		const existing = await get_concept_for_update(locals.db_ontology, data)
		if (existing) {
			throw error(400, 'A concept with this stem, sense, and part of speech already exists.')
		}

		try {
			await record_create_concept(locals.db_ontology, data, locals.user!)
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err)
			return fail(500, { error: `Failed to create concept: ${message}` })
		}

		// Redirect to the changes page because the change isn't actually reflected in Concepts yet
		redirect(303, '/protected/changes?status=pending')
	},
}
