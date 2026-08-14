import { describe, expect, it } from 'vitest'
import { combine_statuses } from './status'

describe('combine_statuses', () => {
	it('returns "Ready to Translate" when all chapters are ready', () => {
		const statuses = [
			{ status: 'Ready to Translate' as const },
			{ status: 'Ready to Translate' as const },
			{ status: 'Ready to Translate' as const },
		]
		expect(combine_statuses(statuses)).toBe('Ready to Translate')
	})

	it('returns "Not Started" when all chapters are not started', () => {
		const statuses = [
			{ status: 'Not Started' as const },
			{ status: 'Not Started' as const },
		]
		expect(combine_statuses(statuses)).toBe('Not Started')
	})

	it('returns "Not Started" when the array is empty', () => {
		expect(combine_statuses([])).toBe('Not Started')
	})

	it('returns "Initial Analysis in Progress" when some chapters are not started', () => {
		const statuses = [
			{ status: 'Initial Analysis Complete' as const },
			{ status: 'Not Started' as const },
		]
		expect(combine_statuses(statuses)).toBe('Initial Analysis in Progress')
	})

	it('returns "Initial Analysis in Progress" when some chapters are in initial analysis', () => {
		const statuses = [
			{ status: 'Initial Analysis Complete' as const },
			{ status: 'Initial Analysis in Progress' as const },
		]
		expect(combine_statuses(statuses)).toBe('Initial Analysis in Progress')
	})

	it('returns "Final Review in Progress" when some chapters are in final review', () => {
		const statuses = [
			{ status: 'Initial Analysis Complete' as const },
			{ status: 'Final Review in Progress' as const },
		]
		expect(combine_statuses(statuses)).toBe('Final Review in Progress')
	})

	it('returns "Initial Analysis Complete" when all chapters are complete but not ready', () => {
		const statuses = [
			{ status: 'Initial Analysis Complete' as const },
			{ status: 'Initial Analysis Complete' as const },
		]
		expect(combine_statuses(statuses)).toBe('Initial Analysis Complete')
	})

	it('prioritizes "Not Started" over "Final Review in Progress"', () => {
		// A book with some "Not Started" and some "Final Review" should show "In Progress"
		// because the "Not Started" check comes first in the predicate chain
		const statuses = [
			{ status: 'Not Started' as const },
			{ status: 'Final Review in Progress' as const },
		]
		expect(combine_statuses(statuses)).toBe('Initial Analysis in Progress')
	})
})
