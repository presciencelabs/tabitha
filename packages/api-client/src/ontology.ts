import type { ConceptSearchFilter, OntologyResult, SourceConcept } from '@tabitha/types'

export interface OntologyClientOptions {
	baseUrl: string
	fetch?: typeof fetch
}

export function createOntologyClient(options: OntologyClientOptions) {
	const { baseUrl } = options
	const cleanBase = baseUrl.replace(/\/$/, '')
	const getFetch = () => options.fetch ?? globalThis.fetch

	return {
		async searchConcepts(filter: Partial<ConceptSearchFilter>): Promise<OntologyResult[]> {
			const params = new URLSearchParams()
			if (filter.q) params.set('q', filter.q)
			if (filter.category) params.set('category', filter.category)
			if (filter.scope) params.set('scope', filter.scope)

			const res = await getFetch()(`${cleanBase}/search?${params.toString()}`)
			if (!res.ok) return []
			return (await res.json()) as OntologyResult[]
		},

		async getConcept(stem: string, sense: string, partOfSpeech?: string): Promise<OntologyResult | null> {
			const query = `${stem}-${sense}`
			const results = await this.searchConcepts({ q: query, category: partOfSpeech })
			return results.find(r => r.stem === stem && r.sense === sense) ?? null
		},

		async lookupConcept(concept: SourceConcept): Promise<OntologyResult | null> {
			if (concept.ontology_data) return concept.ontology_data
			return this.getConcept(concept.stem, concept.sense, concept.part_of_speech)
		},

		async getAllForCategory(partOfSpeech: string): Promise<OntologyResult[]> {
			return this.searchConcepts({ q: '*', category: partOfSpeech })
		},
	}
}

export type OntologyClient = ReturnType<typeof createOntologyClient>
