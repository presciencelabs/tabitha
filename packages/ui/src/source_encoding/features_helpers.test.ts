import { describe, expect, it } from 'vitest'
import { get_features_to_display } from './features_helpers'

describe('features_helpers', () => {
	it('filters out non-displayable feature values ("Unspecified", "Not Applicable", "No...", "Un...")', () => {
		expect(get_features_to_display({ name: 'Proximity', value: 'Not Applicable' })).toBe(false)
		expect(get_features_to_display({ name: 'Spare 1', value: 'Unspecified' })).toBe(false)
		expect(get_features_to_display({ name: 'Specificity', value: 'Not Applicable' })).toBe(false)
		expect(get_features_to_display({ name: 'Participant Status', value: 'Not Applicable' })).toBe(false)
		expect(get_features_to_display({ name: 'Plural', value: 'No' })).toBe(false)
	})

	it('retains displayable grammatical feature values', () => {
		expect(get_features_to_display({ name: 'Number', value: 'Plural' })).toBe(true)
		expect(get_features_to_display({ name: 'Person', value: 'Third' })).toBe(true)
		expect(get_features_to_display({ name: 'Participant Tracking', value: 'Routine' })).toBe(true)
		expect(get_features_to_display({ name: 'Polarity', value: 'Affirmative' })).toBe(true)
	})
})
