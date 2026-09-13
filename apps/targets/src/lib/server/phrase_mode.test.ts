import { describe, expect, test } from 'vitest'
import { attach_encoding_availability } from './phrase_mode'
import type { PhraseMatch } from '$lib/types'
import type { SourceEncodingResult } from '@tabitha/types'

function match(id_tertiary: string): PhraseMatch {
	return {
		reference: { type: 'Bible', id_primary: 'Matthew', id_secondary: '3', id_tertiary },
		text: `verse ${id_tertiary}`,
	}
}

function result(has_encoding: boolean): SourceEncodingResult {
	return { reference: { type: 'Bible', id_primary: 'Matthew', id_secondary: '3', id_tertiary: '1' }, has_encoding }
}

describe('attach_encoding_availability', () => {
	test('reports whether each verse holds an encoding', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2'), match('3')],
			availability: [result(true), result(false), result(true)],
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([true, false, true])
	})

	test('pairs answers to matches by position, keeping each verse with its own', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2')],
			availability: [result(false), result(true)],
		})

		expect(hits).toEqual([
			{ reference: match('1').reference, text: 'verse 1', has_encoding: false },
			{ reference: match('2').reference, text: 'verse 2', has_encoding: true },
		])
	})

	// Not a response `get_verse_encoding_availability` actually produces today -- it always
	// returns one result per reference -- but this pins the function's own contract for if that
	// ever changes: a shorter array should only ever under-promise, never misattribute an answer.
	test('marks verses beyond a short response as having no encoding', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2'), match('3')],
			availability: [result(true)],
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([true, false, false])
	})

	test('marks everything unavailable when the lookup returned nothing at all', () => {
		const hits = attach_encoding_availability({
			matches: [match('1'), match('2')],
			availability: null,
		})

		expect(hits.map(hit => hit.has_encoding)).toEqual([false, false])
	})

	test('returns nothing for no matches', () => {
		expect(attach_encoding_availability({ matches: [], availability: [] })).toEqual([])
	})
})
