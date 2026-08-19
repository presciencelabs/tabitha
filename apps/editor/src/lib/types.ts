import type { LookupWord, OntologyStatus, HowToEntry } from '@tabitha/types'
import type { CaseFrame } from '$lib/rules/case_frame/types'

export type LookupResult = LookupWord & {
	form: string
	sense: string
	level: number
	gloss: string
	categorization: string
	ontology_status: OntologyStatus
	how_to_entries: HowToEntry[]
	case_frame: CaseFrame
}
