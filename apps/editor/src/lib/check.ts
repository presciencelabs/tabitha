import type { EditorCheckResult } from '@tabitha/types'

export async function fetch_check_result(text: string): Promise<EditorCheckResult> {
	const response = await fetch(`/check?text=${encodeURIComponent(text)}`)

	if (!response.ok) {
		return { status: 'error', tokens: [], back_translation: '' }
	}

	return await response.json()
}
