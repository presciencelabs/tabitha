import type { CheckStatus, SimpleToken } from '$lib/types'

export type CheckResponse = {
	status: CheckStatus
	tokens: SimpleToken[]
	back_translation: string
}
