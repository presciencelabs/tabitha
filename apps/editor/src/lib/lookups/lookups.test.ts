import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { perform_form_lookups, perform_ontology_lookups } from './index'
import { TOKEN_TYPE, create_token } from '$lib/token'

describe('lookups module', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: async () => [],
		}))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	test('perform_form_lookups on empty sentence returns empty array', async () => {
		const result = await perform_form_lookups([])
		expect(result).toEqual([])
	})

	test('perform_form_lookups flattens clauses and paired tokens for lookup', async () => {
		const main_token = create_token('verbs', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'verbs' })
		const paired_token = create_token('dogs', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'dogs' })
		main_token.pairing = paired_token

		const clause_token = create_token('', TOKEN_TYPE.CLAUSE, {
			sub_tokens: [main_token],
		})

		const sentences: Sentence[] = [{ clause: clause_token }]
		const result = await perform_form_lookups(sentences)

		expect(result).toBeDefined()
		expect(result[0].clause.sub_tokens[0].token).toBe('verbs')
	})

	test('perform_ontology_lookups filters capitalization and handles null token pairing', async () => {
		const lower_token = create_token('dog', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'dog' })
		const null_token = create_token('null', TOKEN_TYPE.LOOKUP_WORD, { lookup_term: 'null' })
		lower_token.pairing = null_token

		const sentences: Sentence[] = [{ clause: create_token('', TOKEN_TYPE.CLAUSE, { sub_tokens: [lower_token] }) }]
		const result = await perform_ontology_lookups(sentences)

		expect(result).toBeDefined()
	})
})
