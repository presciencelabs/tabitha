import type { AiAssistResult } from '$lib/types'

export async function fetch_phase_1_suggestion(text: string): Promise<AiAssistResult> {
	const response = await fetch('/ai-assist/generate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text }),
	})
	return await response.json()
}
