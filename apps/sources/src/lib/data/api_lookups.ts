import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
import { create_ontology_client } from '@tabitha/api-client'
import type { OntologyResult, ConceptKey } from '@tabitha/types'
import type { PageSourceConcept } from '$lib/types'

const client = create_ontology_client({ base_url: PUBLIC_ONTOLOGY_API_HOST, cache: true })

export function create_fallback_ontology_data(concept: ConceptKey): OntologyResult {
	return {
		...concept,
		level: '',
		gloss: '',
		categorization: '',
		categories: [],
		status: 'in ontology',
		how_to_hints: [],
	}
}

/**
 * Fetch ontology definition for a single concept without mutating the input object
 */
export async function fetch_concept_ontology_data(concept: PageSourceConcept): Promise<OntologyResult> {
	if (concept.ontology_data) {
		return concept.ontology_data
	}

	const fallback = create_fallback_ontology_data(concept)

	try {
		const res = await client.get_concept(concept)
		return res ?? fallback
	} catch {
		return fallback
	}
}

export async function fetch_all_concepts_for_part_of_speech(part_of_speech: string): Promise<OntologyResult[]> {
	try {
		const results = await client.get_all_for_category(part_of_speech)
		return results.filter(result => result.status === 'in ontology')
	} catch {
		return []
	}
}

export async function fetch_ontology_data_for_all_senses(concept: ConceptKey): Promise<OntologyResult[]> {
	const { stem, part_of_speech } = concept

	try {
		const results = await client.search_concepts({ q: stem, category: part_of_speech })
		return results.filter(result => result.stem === stem && result.status === 'in ontology')
	} catch {
		return []
	}
}
