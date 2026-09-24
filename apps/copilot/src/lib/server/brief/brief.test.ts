import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AiClient } from '@tabitha/ai'
import type { BriefInput, BriefSettings } from '$lib/types'

vi.mock('$env/dynamic/private', () => ({ env: { API_KEY_AQUIFER: 'test-key' } }))

const { create_brief_for_verse } = await import('./brief')

const verse = { book: 'Acts', chapter: 1, verse: 1 }

const input: BriefInput = {
	verse,
	settings: { lwc: 'English', rigor: 'LOW' } as BriefSettings,
	notes_result: { type: 'discern', verse, english_text: 'Theophilus, ...', notes: [] },
}

function fake_ai(): AiClient {
	return { generate_json: vi.fn(), generate_text: vi.fn() }
}

describe('create_brief_for_verse', () => {
	const fetch_mock = vi.fn<typeof fetch>()

	beforeEach(() => {
		fetch_mock.mockReset()
		vi.stubGlobal('fetch', fetch_mock)
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	test('a verse with no Aquifer translator notes still gets a brief of its semantic notes, without fetching a nonexistent resource', async () => {
		fetch_mock.mockResolvedValueOnce(Response.json({ totalItemCount: 0, returnedItemCount: 0, offset: 0, items: [] }))
		const ai = fake_ai()

		const result = await create_brief_for_verse({ input, ai })

		expect(result).toEqual({
			type: 'brief',
			verse,
			lwc_text: input.notes_result.english_text,
			semantic_notes: input.notes_result.notes,
			tnn_available: false,
			tnn_notes: [],
			cultural_background: [],
			image_keywords: [],
			consultant_decisions: [],
		})
		expect(fetch_mock).toHaveBeenCalledTimes(1)
		expect(ai.generate_json).not.toHaveBeenCalled()
	})

	test.each([
		{ status: 401, error: 'Authorization error fetching the TNN notes from Aquifer.' },
		{ status: 406, error: 'Aquifer rejected the request for TNN notes (missing API key or rate limit exceeded).' },
		{ status: 429, error: 'Aquifer rate limit exceeded while fetching the TNN notes. Please try again shortly.' },
		{ status: 500, error: 'Error fetching the TNN notes from Aquifer (HTTP 500).' },
	])('an Aquifer HTTP $status reports a specific error', async ({ status, error }) => {
		fetch_mock.mockResolvedValueOnce(new Response(null, { status }))

		const result = await create_brief_for_verse({ input, ai: fake_ai() })

		expect(result).toEqual({ type: 'error', verse, error })
	})

	test('an unreachable Aquifer reports a connection error', async () => {
		fetch_mock.mockRejectedValueOnce(new TypeError('fetch failed'))

		const result = await create_brief_for_verse({ input, ai: fake_ai() })

		expect(result).toEqual({ type: 'error', verse, error: 'Could not reach Aquifer to fetch the TNN notes.' })
	})
})
