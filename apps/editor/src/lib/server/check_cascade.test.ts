import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { expand_token, run_check } from './check'
import recorded_lookups from './check_cascade_lookups.json'
import type { CheckerMessageLabel, CheckerToken } from '@tabitha/types'

// Ontology and Targets responses recorded from the live APIs, so each test runs the
// real parse-and-check pipeline without touching the network.
const RECORDED_LOOKUPS: Record<string, unknown> = recorded_lookups

beforeAll(() => {
	vi.stubGlobal('fetch', async (input: string | URL | Request) => {
		const url = new URL(input instanceof Request ? input.url : input.toString())
		const key = `${url.pathname}${url.search}`
		if (!(key in RECORDED_LOOKUPS)) {
			throw new Error(`No recorded lookup for ${key}`)
		}
		return Response.json(RECORDED_LOOKUPS[key])
	})
})

afterAll(() => {
	vi.unstubAllGlobals()
})

function messages_on({ tokens, token }: { tokens: CheckerToken[]; token: string }): { label: CheckerMessageLabel; message: string }[] {
	return tokens
		.flatMap(expand_token)
		.filter(candidate => candidate.token === token)
		.flatMap(({ messages }) => messages.map(({ label, message }) => ({ label, message })))
}

function labels_on({ tokens, token }: { tokens: CheckerToken[]; token: string }): CheckerMessageLabel[] {
	return messages_on({ tokens, token }).map(({ label }) => label)
}

describe("'where' used as a relativizer", () => {
	const text = 'The man went into the river near the place [where the priests are standing].'

	test('keeps the relativizer error as the only error', async () => {
		const { status, tokens } = await run_check(text)

		expect(status).toBe('error')
		expect(labels_on({ tokens, token: 'where' })).toContain('error')
		expect(labels_on({ tokens, token: 'went' })).not.toContain('error')
		expect(labels_on({ tokens, token: '[' })).not.toContain('error')
	})

	test('points the verb warnings at the relativizer', async () => {
		const { tokens } = await run_check(text)

		expect(messages_on({ tokens, token: 'went' })).toContainEqual({
			label: 'warning',
			message: "This may be caused by 'where' used as a relativizer. Fix that first.",
		})
	})

	test('the corrected encoding checks clean', async () => {
		const { status } = await run_check('The man went into the river near the place [that the priests are standing in].')

		expect(status).toBe('ok')
	})
})

describe('unbracketed clause after a verb that takes a patient clause', () => {
	const text = "Jesus let those sick people touch the edge of Jesus's clothes."

	test('reports the missing bracket on the verb instead of a generic usage error', async () => {
		const { tokens } = await run_check(text)
		const let_messages = messages_on({ tokens, token: 'let' })

		expect(let_messages).toContainEqual({
			label: 'error',
			message: "Put brackets around the clause after 'let', e.g. 'let [X do Y]'.",
		})
		expect(let_messages.map(({ message }) => message)).not.toContainEqual(expect.stringMatching(/^Incorrect usage of/))
	})

	test('downgrades the unexpected patient to a warning', async () => {
		const { tokens } = await run_check(text)

		expect(labels_on({ tokens, token: 'people' })).toEqual(['warning'])
	})

	test('keeps the multiple-verbs error on the second verb', async () => {
		const { tokens } = await run_check(text)

		expect(labels_on({ tokens, token: 'touch' })).toContain('error')
	})

	test('the corrected encoding checks clean', async () => {
		const { status } = await run_check("Jesus let [those sick people touch the edge of Jesus's clothes].")

		expect(status).toBe('ok')
	})
})
