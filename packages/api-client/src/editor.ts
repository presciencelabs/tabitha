import { clean_trailing_slash, type CheckApiResponse } from '@tabitha/types'

export interface EditorClientOptions {
	base_url: string
	fetch?: typeof fetch
}

export function create_editor_client(options: EditorClientOptions) {
	const { base_url } = options
	const clean_base = clean_trailing_slash(base_url)
	const get_fetch = () => options.fetch ?? globalThis.fetch

	return {
		async check_text(text: string): Promise<CheckApiResponse | null> {
			const res = await get_fetch()(`${clean_base}/check`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
			})
			if (!res.ok) return null
			return (await res.json()) as CheckApiResponse
		},
	}
}

export type EditorClient = ReturnType<typeof create_editor_client>
