import type { NounListEntry } from '@tabitha/types'
import type { PageSourceEntity } from '$lib/types'

export type AnalyzerStatus = 'ok' | 'warning' | 'error'

export type AnalysisResult = {
	// status: AnalyzerStatus
	// notes: AnalysisNote[]
	source_entities: PageSourceEntity[]
	noun_list: NounListEntry[]
}
