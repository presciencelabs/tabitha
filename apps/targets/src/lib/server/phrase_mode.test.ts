import { describe, expect, test } from 'vitest'
import { attach_encoding_availability } from './phrase_mode'
import type { PhraseMatch } from '$lib/types'
import type { SourceStatus, SourceVerseStatusResult } from '@tabitha/types'

function match(id_tertiary: string): PhraseMatch {
	return {
		reference: { type: 'Bible', id_primary: 'Matthew', id_secondary: '3', id_tertiary },
		text: `verse ${id_tertiary}`,
	}
}

function result({ has_encoding, status = 'Ready to Translate' }: {
	has_encoding: boolean
	status?: SourceStatus
}): SourceVerseStatusResult {
	return { reference: { id_primary: 'Matthew' }, status, has_encoding }
}

describe('attach_encoding_availability', () => {
	test('reports whether each verse holds an encoding', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2'), match('3')],
			statuses: [
				result({ has_encoding: true }),
				result({ has_encoding: false }),
				result({ has_encoding: true }),
			],
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([true, false, true])
	})

	// Status is loaded from the team's verse-status CSV, not the TBTA export the encodings come
	// from, so it describes how far along the people are rather than whether an encoding exists.
	// Nothing keeps the two migrations in step, so neither direction of disagreement is ruled out.
	test('ignores status entirely, however far along it claims the verse is', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2')],
			statuses: [
				result({ has_encoding: false, status: 'Final Review in Progress' }),
				result({ has_encoding: true, status: 'Not Started' }),
			],
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([false, true])
	})

	test('pairs answers to matches by position, keeping each verse with its own', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2')],
			statuses: [result({ has_encoding: false }), result({ has_encoding: true })],
		})

		expect(hits).toEqual([
			{ reference: match('1').reference, text: 'verse 1', has_encoding: false },
			{ reference: match('2').reference, text: 'verse 2', has_encoding: true },
		])
	})

	// Ordering is load-bearing across an HTTP boundary here, so a truncated response must not
	// shift answers onto the wrong verses -- it should only ever under-promise.
	test('marks verses beyond a short response as having no encoding', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2'), match('3')],
			statuses: [result({ has_encoding: true })],
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([true, false, false])
	})

	test('marks everything unavailable when the lookup returned nothing at all', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2')],
			statuses: null,
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([false, false])
	})

	test('returns nothing for no matches', () => {
		expect(attach_encoding_availability({ matches: [], statuses: [] })).toEqual([])
	})
})
