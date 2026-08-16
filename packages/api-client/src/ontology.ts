import { type ConceptSearchFilter, type OntologyResult, type SourceConcept } from '@tabitha/types'
import { create_http_client, type ClientOptions } from './http'

export type OntologyClient = ReturnType<typeof create_ontology_client>
export type OntologyClientOptions = ClientOptions

/**
 * Creates a typed HTTP client for communicating with the Ontology service (`apps/ontology`).
 *
 * @example
 * ```typescript
 * import { create_ontology_client } from '@tabitha/api-client'
 *
 * const ontology = create_ontology_client({
 *   base_url: PUBLIC_ONTOLOGY_API_HOST,
 *   cache: true, // Enables transparent Edge CDN caching on GET requests
 * })
 *
 * const results = await ontology.search_concepts({ q: 'love', category: 'Verb' })
 * const concept = await ontology.get_concept('write-01', 'A')
 * ```
 */
export function create_ontology_client(options: OntologyClientOptions) {
	const http = create_http_client(options)

	return {
		/**
		 * Search ontology concepts by text query, part-of-speech category, or scope.
		 */
		async search_concepts<T = OntologyResult>(filter: Partial<ConceptSearchFilter>): Promise<T[]> {
			const params = new URLSearchParams()
			if (filter.q) params.set('q', filter.q)
			if (filter.category) params.set('category', filter.category)
			if (filter.scope) params.set('scope', filter.scope)

			return (await http.get<T[]>(`/search?${params.toString()}`)) ?? []
		},

		/**
		 * Look up a single concept by its stem, sense, and optional part of speech.
		 */
		async get_concept<T = OntologyResult>(stem: string, sense: string, part_of_speech?: string): Promise<T | null> {
			const query = `${stem}-${sense}`
			const results = await this.search_concepts<T & { stem: string; sense: string }>({ q: query, category: part_of_speech })
			return results.find(r => r.stem === stem && r.sense === sense) ?? null
		},

		/**
		 * Retrieve ontology data for a given SourceConcept, using cached data if present.
		 */
		async lookup_concept<T = OntologyResult>(concept: SourceConcept): Promise<T | null> {
			if (concept.ontology_data) return concept.ontology_data as unknown as T
			return this.get_concept<T>(concept.stem, concept.sense, concept.part_of_speech)
		},

		/**
		 * Retrieve all ontology concepts belonging to a part-of-speech category.
		 */
		async get_all_for_category<T = OntologyResult>(part_of_speech: string): Promise<T[]> {
			return this.search_concepts<T>({ q: '*', category: part_of_speech })
		},
	}
}
