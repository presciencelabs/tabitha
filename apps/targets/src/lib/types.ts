import type { SourceEntityCategory, PartOfSpeech } from '@tabitha/types'

//===============
// UI-related

export type FilterMap = Map<string, string[]>

export type ReturnTo = {
	app: string
	q: string
}

//===============
// Db types

export type DbRowText = {
	text: string
	audience: string
	book: string
	chapter: number
	verse: number
}

export type DbRowLexicon = {
	id: number
	project: string
	stem: string
	part_of_speech: PartOfSpeech
	gloss: string
	features: string
	constituents: string
	forms: string
}

export type DbRowFormNames = {
	project: string
	part_of_speech: PartOfSpeech
	name: string
	position: number
}

export type DbRowFeature = {
	project: string
	category: SourceEntityCategory
	feature: string
	position: number
	code: string
	value: string
}

//===============
// text search query helpers

export type AndTerm = string

export type OrTerm = {
	and_terms: AndTerm[]
}

export type ParsedSearchQuery = {
	or_terms: OrTerm[]
}
