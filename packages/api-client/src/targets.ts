import { clean_trailing_slash, type TargetApiFeatureResult, type TargetTextResult, type VerseReference } from '@tabitha/types'

export interface TargetsClientOptions {
	base_url: string
	fetch?: typeof fetch
}

export function create_targets_client(options: TargetsClientOptions) {
	const { base_url } = options
	const clean_base = clean_trailing_slash(base_url)
	const get_fetch = () => options.fetch ?? globalThis.fetch

	return {
		async get_target_text(ref: VerseReference, project = 'English', preferred_audience = 'Unchurched Adults'): Promise<TargetTextResult | null> {
			const res = await get_fetch()(`${clean_base}/${project}/${ref.book}/${ref.chapter}/${ref.verse}`)
			if (!res.ok) return null
			const results = (await res.json()) as TargetTextResult[]
			return results.find(r => r.audience === preferred_audience) ?? results.at(0) ?? null
		},

		async get_features(category?: string): Promise<TargetApiFeatureResult | null> {
			const url = category ? `${clean_base}/features/${category}` : `${clean_base}/features`
			const res = await get_fetch()(url)
			if (!res.ok) return null
			return (await res.json()) as TargetApiFeatureResult
		},
	}
}

export type TargetsClient = ReturnType<typeof create_targets_client>
