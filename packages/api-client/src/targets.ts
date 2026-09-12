import type { TargetFormResult, TargetFeatureResult, TargetTextResult, VerseReference } from '@tabitha/types'
import { create_http_client, type ClientOptions } from './http'

export type TargetsClient = ReturnType<typeof create_targets_client>
export type TargetsClientOptions = ClientOptions

/**
 * Creates a typed HTTP client for communicating with the Targets service (`apps/targets`).
 *
 * @example
 * ```typescript
 * import { create_targets_client } from '@tabitha/api-client'
 *
 * const targets = create_targets_client({
 *   base_url: PUBLIC_TARGETS_API_HOST,
 *   cache: true, // Enables transparent Edge CDN caching on GET requests
 * })
 *
 * const text = await targets.get_target_text({ book: 'GEN', chapter: 1, verse: 1 }, 'English')
 * const forms = await targets.lookup_forms('loved')
 * ```
 */
export function create_targets_client(options: TargetsClientOptions) {
	const http = create_http_client(options)

	return {
		/**
		 * Retrieve generated target translation text for a verse reference and audience.
		 */
		async get_target_text(ref: VerseReference, project = 'English', preferred_audience = 'Unchurched Adults'): Promise<TargetTextResult | null> {
			const results = await http.get<TargetTextResult[]>(`/${project}/${ref.book}/${ref.chapter}/${ref.verse}`)
			if (!results) return null
			return results.find(r => r.audience === preferred_audience) ?? results.at(0) ?? null
		},

		/**
		 * Retrieve target grammatical features, optionally filtered by category.
		 */
		async get_features(category?: string): Promise<TargetFeatureResult | null> {
			const path = category ? `/features/${category}` : '/features'
			return http.get<TargetFeatureResult>(path)
		},

		/**
		 * Search lexical forms and inflections for a word token in a target language project.
		 */
		async lookup_forms(word: string, project = 'English'): Promise<TargetFormResult[]> {
			return await http.get<TargetFormResult[]>(`/${project}/lookup/forms?word=${encodeURIComponent(word)}`) ?? []
		},

		/**
		 * Retrieve full source and lexical feature maps for a target project.
		 */
		async lookup_features(project = 'English'): Promise<TargetFeatureResult | null> {
			return http.get<TargetFeatureResult>(`/${project}/lookup/features`)
		},
	}
}
