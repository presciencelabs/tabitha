import { type ChapterReference, type Reference, type SourceData, type SourceStatus, type VerseReference } from '@tabitha/types'
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
		async get_verse_source(ref: VerseReference, type = 'Bible'): Promise<SourceData | null> {
			return http.get<SourceData>(`/${type}/${ref.book}/${ref.chapter}/${ref.verse}`)
		},

		/**
		 * Retrieve simplified JSON encoding for a verse, optionally including glosses.
		 */
		async get_simplified_json<T = unknown>(ref: VerseReference, type = 'Bible', include_glosses = false): Promise<T | null> {
			const query = include_glosses ? '?glosses=true' : ''
			return http.get<T>(`/${type}/${ref.book}/${ref.chapter}/${ref.verse}/simple-json${query}`)
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
			const data = await http.get<{ status: SourceStatus }>(`/lookup/status?type=${ref.type}&id_primary=${ref.id_primary}&id_secondary=${ref.id_secondary}&id_tertiary=${ref.id_tertiary}`)
			return data?.status ?? null
		},

		/**
		 * Look up the translation status of an entire book (e.g. 'GEN').
		 */
		async get_book_status(book: string, type = 'Bible'): Promise<SourceStatus | null> {
			const data = await http.get<{ status: SourceStatus }>(`/lookup/status/${type}/${book}`)
			return data?.status ?? null
		},
	}
}
