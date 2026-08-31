import type { CheckResponse } from '@tabitha/types'

export async function fetch_check_result(text: string): Promise<CheckResponse> {
	const response = await fetch(`/check?text=${encodeURIComponent(text)}`)

	if (!response.ok) {
		return { status: 'error', tokens: [], back_translation: '' }
	}

	return await response.json()
}
