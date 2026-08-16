import { clean_trailing_slash, type ConceptSearchFilter, type OntologyResult, type SourceConcept } from '@tabitha/types'

export interface OntologyClientOptions {
	base_url: string
	fetch?: typeof fetch
}

export function create_ontology_client(options: OntologyClientOptions) {
	const { base_url } = options
	const clean_base = clean_trailing_slash(base_url)
	const get_fetch = () => options.fetch ?? globalThis.fetch

	return {
		async search_concepts(filter: Partial<ConceptSearchFilter>): Promise<OntologyResult[]> {
			const params = new URLSearchParams()
			if (filter.q) params.set('q', filter.q)
			if (filter.category) params.set('category', filter.category)
			if (filter.scope) params.set('scope', filter.scope)

			const res = await get_fetch()(`${clean_base}/search?${params.toString()}`)
			if (!res.ok) return []
			return (await res.json()) as OntologyResult[]
		},

		async get_concept(stem: string, sense: string, part_of_speech?: string): Promise<OntologyResult | null> {
			const query = `${stem}-${sense}`
			const results = await this.search_concepts({ q: query, category: part_of_speech })
			return results.find(r => r.stem === stem && r.sense === sense) ?? null
		},

		async lookup_concept(concept: SourceConcept): Promise<OntologyResult | null> {
			if (concept.ontology_data) return concept.ontology_data
			return this.get_concept(concept.stem, concept.sense, concept.part_of_speech)
		},

		async get_all_for_category(part_of_speech: string): Promise<OntologyResult[]> {
			return this.search_concepts({ q: '*', category: part_of_speech })
		},
	}
}

export type OntologyClient = ReturnType<typeof create_ontology_client>
