import { clean_trailing_slash, type ChapterReference, type Reference, type SourceData, type SourceStatus, type VerseReference } from '@tabitha/types'

export interface SourcesClientOptions {
	base_url: string
	fetch?: typeof fetch
}

export function create_sources_client(options: SourcesClientOptions) {
	const { base_url } = options
	const clean_base = clean_trailing_slash(base_url)
	const get_fetch = () => options.fetch ?? globalThis.fetch

	return {
		async get_verse_source(ref: VerseReference, type = 'Bible'): Promise<SourceData | null> {
			const res = await get_fetch()(`${clean_base}/${type}/${ref.book}/${ref.chapter}/${ref.verse}`)
			if (!res.ok) return null
			return (await res.json()) as SourceData
		},

		async get_simplified_json<T = unknown>(ref: VerseReference, type = 'Bible', include_glosses = false): Promise<T | null> {
			const url = `${clean_base}/${type}/${ref.book}/${ref.chapter}/${ref.verse}/simple-json${include_glosses ? '?glosses=true' : ''}`
			const res = await get_fetch()(url)
			if (!res.ok) return null
			return (await res.json()) as T
		},

		async get_chapter_verses_count(ref: ChapterReference, type = 'Bible'): Promise<number> {
			const res = await get_fetch()(`${clean_base}/${type}/${ref.book}/${ref.chapter}`)
			if (!res.ok) return 0
			const entries = (await res.json()) as { id_tertiary: string }[]
			if (!entries || entries.length === 0) return 0
			return Math.max(...entries.map(e => parseInt(e.id_tertiary, 10)))
		},

		async get_verse_status(ref: Reference): Promise<SourceStatus | null> {
			const res = await get_fetch()(`${clean_base}/lookup/status?type=${ref.type}&id_primary=${ref.id_primary}&id_secondary=${ref.id_secondary}&id_tertiary=${ref.id_tertiary}`)
			if (!res.ok) return null
			const data = (await res.json()) as { status: SourceStatus }
			return data.status ?? null
		},
	}
}

export type SourcesClient = ReturnType<typeof create_sources_client>
