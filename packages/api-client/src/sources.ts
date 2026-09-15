import type { ChapterReference, Reference, SourceResult, SourceStatus, SourceStatusResult, SourceEncodingResult, VerseReference, SourceSimpleJsonResult } from '@tabitha/types'
import { create_http_client, type ClientOptions } from './http'

export type SourcesClient = ReturnType<typeof create_sources_client>
export type SourcesClientOptions = ClientOptions

/**
 * Creates a typed HTTP client for communicating with the Sources service (`apps/sources`).
 *
 * @example
 * ```typescript
 * import { create_sources_client } from '@tabitha/api-client'
 *
 * const sources = create_sources_client({
 *   base_url: PUBLIC_SOURCES_API_HOST,
 *   cache: true, // Enables transparent Edge CDN caching on GET requests
 * })
 *
 * const verse = await sources.get_verse_source({ book: 'GEN', chapter: 1, verse: 1 })
 * const status = await sources.get_book_status('GEN')
 * ```
 */
export function create_sources_client(options: SourcesClientOptions) {
	const http = create_http_client(options)

	return {
		/**
		 * Retrieve raw source data for a specific Bible verse.
		 */
		async get_verse_source(ref: VerseReference, type = 'Bible'): Promise<SourceResult | null> {
			return http.get<SourceResult>(`/${type}/${ref.book}/${ref.chapter}/${ref.verse}`)
		},

		/**
		 * Retrieve simplified JSON encoding for a verse, optionally including glosses.
		 */
		async get_simplified_json(ref: VerseReference, type = 'Bible', include_glosses = false): Promise<SourceSimpleJsonResult | null> {
			const query = include_glosses ? '?glosses=true' : ''
			return http.get<SourceSimpleJsonResult>(`/${type}/${ref.book}/${ref.chapter}/${ref.verse}/simple-json${query}`)
		},

		/**
		 * Retrieve the number of verses present in a chapter.
		 */
		async get_chapter_verses_count(ref: ChapterReference, type = 'Bible'): Promise<number> {
			const entries = await http.get<{ id_tertiary: string }[]>(`/${type}/${ref.book}/${ref.chapter}`)
			if (!entries || entries.length === 0) return 0
			return Math.max(...entries.map(e => parseInt(e.id_tertiary, 10)))
		},

		/**
		 * Look up the translation status of a specific verse reference.
		 */
		async get_verse_status(ref: Reference): Promise<SourceStatus | null> {
			const data = await http.post<SourceStatusResult[]>('/lookup/status', [ref])
			return data?.[0]?.status ?? null
		},

		/**
		 * Look up the translation status of multiple verse references at once.
		 */
		async get_verse_statuses(refs: Reference[]): Promise<SourceStatusResult[] | null> {
			const data = await http.post<SourceStatusResult[]>('/lookup/status', refs)
			return data
		},

		/**
		 * Look up whether each of multiple verse references actually holds a semantic encoding.
		 *
		 * Deliberately a separate call from `get_verse_statuses`, not an extra field on it:
		 * `status` and the presence of an encoding come from two migrations that never consult
		 * each other, so status is not a reliable stand-in for this question. See `/lookup/encoded`
		 * in the Sources README.
		 */
		async get_verse_encoding_availability(refs: Reference[]): Promise<SourceEncodingResult[] | null> {
			return await http.post<SourceEncodingResult[]>('/lookup/encoded', refs)
		},

		/**
		 * Look up the translation status of an entire book (e.g. 'GEN').
		 */
		async get_book_status(book: string, type = 'Bible'): Promise<SourceStatus | null> {
			const data = await http.get<SourceStatusResult>(`/lookup/status/${type}/${book}`)
			return data?.status ?? null
		},

		/**
		 * Look up the translation status of every book of a given type.
		 */
		async get_all_book_statuses(type = 'Bible'): Promise<{ reference: { id_primary: string }, status: SourceStatus }[]> {
			return await http.get<SourceStatusResult[]>(`/lookup/status/${type}`) ?? []
		},
	}
}
