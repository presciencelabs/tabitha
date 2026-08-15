import type { CheckApiResponse } from '@tabitha/types'

export interface EditorClientOptions {
	baseUrl: string
	fetch?: typeof fetch
}

export function createEditorClient(options: EditorClientOptions) {
	const { baseUrl } = options
	const cleanBase = baseUrl.replace(/\/$/, '')
	const getFetch = () => options.fetch ?? globalThis.fetch

	return {
		async checkText(text: string): Promise<CheckApiResponse | null> {
			const res = await getFetch()(`${cleanBase}/check`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
			})
			if (!res.ok) return null
			return (await res.json()) as CheckApiResponse
		},
	}
}

export type EditorClient = ReturnType<typeof createEditorClient>
