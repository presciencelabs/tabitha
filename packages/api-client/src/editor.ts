import type { CheckResponse, SimpleSourceData } from '@tabitha/types'
import { create_http_client, type ClientOptions } from './http'

export type EditorClient = ReturnType<typeof create_editor_client>
export type EditorClientOptions = ClientOptions

/**
 * Creates a typed HTTP client for communicating with the Editor service (`apps/editor`).
 *
 * @example
 * ```typescript
 * import { create_editor_client } from '@tabitha/api-client'
 *
 * const editor = create_editor_client({
 *   base_url: PUBLIC_EDITOR_API_HOST,
 * })
 *
 * const check = await editor.check_text('Paul write-01 a letter.')
 * ```
 */
export function create_editor_client(options: EditorClientOptions) {
	const http = create_http_client(options)

	return {
		/**
		 * Check, analyze, and generate backtranslation tokens for a given source text.
		 */
		async check_text(text: string): Promise<CheckResponse | null> {
			return http.get<CheckResponse>(`/check?text=${encodeURIComponent(text)}`)
		},

		/**
		 * Parse input text into sentences and extract source entities and features.
		 */
		async analyze_text(text: string): Promise<SimpleSourceData | null> {
			return http.get<SimpleSourceData>(`/analyze?text=${encodeURIComponent(text)}`)
		},
	}
}
