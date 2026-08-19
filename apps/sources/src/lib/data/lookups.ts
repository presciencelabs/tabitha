import type { SourceStatus } from '@tabitha/types'

export const testament_groupings: Record<string, [number, number]> = {
	'Old Testament': [1, 39],
	'New Testament': [40, 66],
}

export const status_list: SourceStatus[] = ['Not Started', 'Initial Analysis in Progress', 'Initial Analysis Complete', 'Final Review in Progress', 'Ready to Translate']
