import type { TargetApiFeatureResult, TargetTextResult, VerseReference } from '@tabitha/types'

export interface TargetsClientOptions {
	baseUrl: string
	fetch?: typeof fetch
}

export function createTargetsClient(options: TargetsClientOptions) {
	const { baseUrl } = options
	const cleanBase = baseUrl.replace(/\/$/, '')
	const getFetch = () => options.fetch ?? globalThis.fetch

	return {
		async getTargetText(ref: VerseReference, project = 'English', preferredAudience = 'Unchurched Adults'): Promise<TargetTextResult | null> {
			const res = await getFetch()(`${cleanBase}/${project}/${ref.book}/${ref.chapter}/${ref.verse}`)
			if (!res.ok) return null
			const results = (await res.json()) as TargetTextResult[]
			return results.find(r => r.audience === preferredAudience) ?? results.at(0) ?? null
		},

		async getFeatures(category?: string): Promise<TargetApiFeatureResult | null> {
			const url = category ? `${cleanBase}/features/${category}` : `${cleanBase}/features`
			const res = await getFetch()(url)
			if (!res.ok) return null
			return (await res.json()) as TargetApiFeatureResult
		},
	}
}

export type TargetsClient = ReturnType<typeof createTargetsClient>
