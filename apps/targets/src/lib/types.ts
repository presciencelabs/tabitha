import type { Reference, SourceEntityCategory, PartOfSpeech } from '@tabitha/types'

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

//===============
// phrase search (api.bible)

export type PhraseMatch = {
	reference: Reference
	text: string
}

export type PhraseSearchOutcome =
	| { kind: 'ok', matches: PhraseMatch[], complete: boolean, fums_token: string | null }
	| { kind: 'unsupported_project', project: string }
	| { kind: 'unavailable' }

export type PhraseSearchHit = {
	reference: Reference
	/** the matching verse, as the scripture API returned it */
	text: string
	/** whether Sources holds a semantic encoding, so this verse's structure can be shown */
	has_encoding: boolean
}

export type PhraseSearchResults = {
	hits: PhraseSearchHit[]
	/** false when the page budget was spent before the result set ran out */
	complete: boolean
	/** api.bible's usage-tracking token, reported once the verses are actually rendered */
	fums_token: string | null
	notice: 'unsupported_project' | 'unavailable' | null
}
