import { describe, expect, test } from 'vitest'
import { convert_to_usfm_for_discern, error_result } from './copilot_core'

const verse: VerseReference = { book: 'Genesis', chapter: 1, verse: 1 }

function make_result(overrides: Partial<CopilotApiResult> = {}): CopilotApiResult {
	return {
		verse,
		english_text: 'In the beginning God created the heavens and the earth.',
		notes: [],
		...overrides,
	}
}

describe('error_result', () => {
	test('carries the reference and message into an empty, errored result', () => {
		expect(error_result({ reference: verse, message: 'boom' })).toEqual({
			verse,
			error: 'boom',
			english_text: '',
			notes: [],
		})
	})
})

describe('convert_to_usfm_for_discern', () => {
	test('renders an error line when the result has an error', () => {
		const sfm = convert_to_usfm_for_discern('English')(make_result({ error: 'no text' }))

		expect(sfm).toBe('\\p \\v 1 Unexpected error loading notes for this verse. Contact an administrator.')
	})

	test('falls back to the LWC no-notes text when there are no notes', () => {
		const sfm = convert_to_usfm_for_discern('English')(make_result())

		expect(sfm).toBe([
			'\\p \\v 1 In the beginning God created the heavens and the earth.',
			'\\li - No notes for this verse based on the TBTA analysis.',
		].join('\n'))
	})

	test('renders one \\li line per note, and an optional \\p line for the LWC text', () => {
		const result = make_result({
			lwc_text: 'Na mwanzo Mungu aliumba mbingu na dunia.',
			notes: [
				{ meaning: 'Meaning one', check: 'Check one.', quoted_text: 'beginning', trigger: { name: 'trigger-1', node_id: '1', flags: [], weight: 1 } },
				{ meaning: 'Meaning two', check: 'Check two.', quoted_text: 'earth', trigger: { name: 'trigger-2', node_id: '2', flags: [], weight: 1 } },
			],
		})

		const sfm = convert_to_usfm_for_discern('English')(result)

		expect(sfm).toBe([
			'\\p \\v 1 In the beginning God created the heavens and the earth.',
			'\\p Na mwanzo Mungu aliumba mbingu na dunia.',
			'\\li - Meaning one Check one.',
			'\\li - Meaning two Check two.',
		].join('\n'))
	})
})
