import { describe, test, expect } from 'vitest'
import { get_status } from './check'
import type { Message, SimpleToken } from '@tabitha/types'

describe('get_status', () => {
	test('ok when there are no messages', () => {
		expect(get_status([token_with_messages([])])).toBe('ok')
	})

	test('warning when the worst message is a warning', () => {
		expect(get_status([token_with_messages([message('suggest'), message('warning')])])).toBe('warning')
	})

	test('error when any message is an error, even alongside warnings', () => {
		expect(get_status([token_with_messages([message('warning'), message('error')])])).toBe('error')
	})

	test('looks inside pairing, pronoun, and sub_tokens', () => {
		expect(get_status([{ ...token_with_messages([]), pairing: token_with_messages([message('error')]) }])).toBe('error')
		expect(get_status([{ ...token_with_messages([]), pronoun: token_with_messages([message('warning')]) }])).toBe('warning')
		expect(get_status([{ ...token_with_messages([]), sub_tokens: [token_with_messages([message('error')])] }])).toBe('error')
	})
})

function message(label: Message['label']): Message {
	return { label, severity: 0, message: '', rule_id: '' }
}

function token_with_messages(messages: Message[]): SimpleToken {
	return {
		token: '',
		type: 'Word',
		tag: {},
		messages,
		applied_rules: [],
		lookup_results: [],
		pairing: null,
		pairing_type: 'none',
		pronoun: null,
		sub_tokens: [],
	}
}
