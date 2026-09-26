import { describe, expect, it } from 'vitest'
import { to_check_event } from './usage'
import type { CheckerToken, EditorCheckResult } from '@tabitha/types'

const token_with = (labels: string[], extra: Partial<CheckerToken> = {}) => ({
	token: 'word',
	messages: labels.map(label => ({ label, message: `${label} message` })),
	sub_tokens: [],
	...extra,
}) as unknown as CheckerToken

describe('to_check_event', () => {
	it('counts errors and warnings, including those on paired tokens', () => {
		const result = {
			status: 'error',
			back_translation: '',
			tokens: [
				token_with(['error', 'warning']),
				token_with(['info'], { pairing: token_with(['warning']) }),
			],
		} as EditorCheckResult

		expect(to_check_event({ result, caller: 'same-origin' })).toEqual({
			kind: 'check',
			caller: 'same-origin',
			status: 'error',
			error_count: 1,
			warning_count: 2,
			token_count: 2,
		})
	})
})
