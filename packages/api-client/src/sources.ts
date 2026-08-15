import type { ChapterReference, Reference, SourceData, SourceStatus, VerseReference } from '@tabitha/types'

export interface SourcesClientOptions {
	baseUrl: string
	fetch?: typeof fetch
}

export function createSourcesClient(options: SourcesClientOptions) {
	const { baseUrl } = options
	const cleanBase = baseUrl.replace(/\/$/, '')
	const getFetch = () => options.fetch ?? globalThis.fetch

	return {
		async getVerseSource(ref: VerseReference, type = 'Bible'): Promise<SourceData | null> {
			const res = await getFetch()(`${cleanBase}/${type}/${ref.book}/${ref.chapter}/${ref.verse}`)
			if (!res.ok) return null
			return (await res.json()) as SourceData
		},

		async getSimplifiedJson<T = unknown>(ref: VerseReference, type = 'Bible', includeGlosses = false): Promise<T | null> {
			const url = `${cleanBase}/${type}/${ref.book}/${ref.chapter}/${ref.verse}/simple-json${includeGlosses ? '?glosses=true' : ''}`
			const res = await getFetch()(url)
			if (!res.ok) return null
			return (await res.json()) as T
		},

		async getChapterVersesCount(ref: ChapterReference, type = 'Bible'): Promise<number> {
			const res = await getFetch()(`${cleanBase}/${type}/${ref.book}/${ref.chapter}`)
			if (!res.ok) return 0
			const entries = (await res.json()) as { id_tertiary: string }[]
			if (!entries || entries.length === 0) return 0
			return Math.max(...entries.map(e => parseInt(e.id_tertiary, 10)))
		},

		async getVerseStatus(ref: Reference): Promise<SourceStatus | null> {
			const res = await getFetch()(`${cleanBase}/lookup/status?type=${ref.type}&id_primary=${ref.id_primary}&id_secondary=${ref.id_secondary}&id_tertiary=${ref.id_tertiary}`)
			if (!res.ok) return null
			const data = (await res.json()) as { status: SourceStatus }
			return data.status ?? null
		},
	}
}

export type SourcesClient = ReturnType<typeof createSourcesClient>
