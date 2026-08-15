import type { ConceptSearchFilter, OntologyResult, SourceConcept } from '@tabitha/types'

export interface OntologyClientOptions {
	baseUrl: string
	fetch?: typeof fetch
}

export function create_ontology_client(options: OntologyClientOptions) {
	const { baseUrl } = options
	const cleanBase = baseUrl.replace(/\/$/, '')
	const getFetch = () => options.fetch ?? globalThis.fetch

	return {
		async search_concepts(filter: Partial<ConceptSearchFilter>): Promise<OntologyResult[]> {
			const params = new URLSearchParams()
			if (filter.q) params.set('q', filter.q)
			if (filter.category) params.set('category', filter.category)
			if (filter.scope) params.set('scope', filter.scope)

			const res = await getFetch()(`${cleanBase}/search?${params.toString()}`)
			if (!res.ok) return []
			return (await res.json()) as OntologyResult[]
		},

		async get_concept(stem: string, sense: string, partOfSpeech?: string): Promise<OntologyResult | null> {
			const query = `${stem}-${sense}`
			const results = await this.search_concepts({ q: query, category: partOfSpeech })
			return results.find(r => r.stem === stem && r.sense === sense) ?? null
		},

		async lookup_concept(concept: SourceConcept): Promise<OntologyResult | null> {
			if (concept.ontology_data) return concept.ontology_data
			return this.get_concept(concept.stem, concept.sense, concept.part_of_speech)
		},

		async get_all_for_category(partOfSpeech: string): Promise<OntologyResult[]> {
			return this.search_concepts({ q: '*', category: partOfSpeech })
		},
	}
}

export type OntologyClient = ReturnType<typeof create_ontology_client>
