import { expect } from 'vitest'
import { get_message_type, TOKEN_TYPE, create_token, create_lookup_result } from './token'
import type { MessageLabel, OntologyStatus, PairingType, Tag, Token } from '@tabitha/types'
import type { LookupResult } from '$lib/types'

export function expect_error(token: Token | null | undefined, message: string) {
	expect_message(token, 'error', message)
}

export function expect_message(token: Token | null | undefined, label: MessageLabel, message: string) {
	expect(token?.messages).toContainEqual(expect.objectContaining({ ...get_message_type(label), message }))
}

export function expect_error_to_match(token: Token | null | undefined, regex: RegExp) {
	expect_message_to_match(token, 'error', regex)
}

export function expect_message_to_match(token: Token | null | undefined, message_type: MessageLabel, regex: RegExp) {
	expect(token?.messages[0].label).toBe(message_type)
	expect(token?.messages[0].message).toMatch(regex)
}

export function expect_no_message(token: Token | null | undefined) {
	expect(token?.messages.length).toBe(0)
}

export function create_lookup_token_for_test(token: string, { lookup_results = [], tag = {} }: { lookup_results?: LookupResult[]; tag?: Tag } = {}): Token {
	return create_token(token, TOKEN_TYPE.LOOKUP_WORD, { tag, lookup_term: token, lookup_results })
}

export function create_pairing_token_for_test(left: Token, right: Token, pairing_type: PairingType = 'complex'): Token {
	left.pairing = right
	left.pairing_type = pairing_type
	return left
}

export function lookup_result_for_test(stem: string, { sense = 'A', part_of_speech = 'Noun', level = 1, ontology_status = 'in ontology' as OntologyStatus }: { sense?: string; part_of_speech?: string; level?: number; ontology_status?: OntologyStatus } = {}): LookupResult {
	return create_lookup_result({ stem, part_of_speech }, { sense, level, ontology_status })
}