import type { LookupWord, OntologyStatus, HowToEntry } from '@tabitha/types'

export type LexicalFormResult = LookupWord & {
	form: string
}

export type OntologyResult = LookupWord & {
	sense: string
	level: string
	gloss: string
	categorization: string
	status: OntologyStatus
	how_to_hints: HowToEntry[]
}
