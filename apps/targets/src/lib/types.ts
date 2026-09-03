export type SourceReference = {
	type: string
	id_primary: string
	id_secondary: number
	id_tertiary: number
}

export type EntityFeature = {
	name: string
	value: string
}

export type SourceConcept = {
	stem: string
	sense: string
}

/** A positional string of character codes straight from the source encoding (e.g., '4A4SDAnS3NN') */
export type FeatureCodeString = string

export type SourceEntity = {
	value: string
	category: string
	category_abbr: string
	feature_codes: FeatureCodeString
	features: EntityFeature[]
	concept: SourceConcept | null
	pairing_concept: SourceConcept | null
}

export type SourceData = {
	parsed_semantic_encoding: SourceEntity[]
}

export type TextResult = {
	text: string
	audience: string
	ideal?: string
}

export type BookResult = {
	book: string
}

export type ChapterResult = {
	chapter: number
}

export type VerseResult = {
	verse: number
}

export type DbTextResult = TextResult & BookResult & ChapterResult & VerseResult

export type SearchTextResult = {
	reference: SourceReference
	texts: TextResult[]
}

export type FilterMap = Map<string, string[]>

export type ReturnTo = {
	app: string
	q: string
}

export type DbRowLexicon = {
	id: number
	project: string
	stem: string
	part_of_speech: string
	gloss: string
	features: string
	constituents: string
	forms: string
}

export type LexicalForm = {
	id: number
	stem: string
	part_of_speech: string
	form: string
}

export type DbRowFormNames = {
	project: string
	part_of_speech: string
	name: string
	position: number
}

export type FormNameMap = {
	part_of_speech: string
	name: string
	position: number
}

export type DbRowFeature = {
	project: string
	category: string
	feature: string
	position: number
	code: string
	value: string
}

export type CategoryName = string

export type AndTerm = string

export type OrTerm = {
	and_terms: AndTerm[]
}

export type ParsedSearchQuery = {
	or_terms: OrTerm[]
}
