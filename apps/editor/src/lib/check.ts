import type { CheckResponse } from '@tabitha/types'

export async function fetch_check_result(text: string): Promise<CheckResponse> {
	const response = await fetch(`/check?text=${text}`)
	return await response.json()
}
