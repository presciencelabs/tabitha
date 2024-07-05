type DbRowConcept = {
	id: string
	stem: string
	sense: string
	part_of_speech: string
	level: string
	categorization: string
	examples: string
	curated_examples: string
	gloss: string
	brief_gloss: string
	occurrences: string
}

type SimplificationHint = {
	term: string
	part_of_speech: string
	structure: string
	pairing: string
	explication: string
}

interface Concept extends DbRowConcept {
	categories: string[]
	examples: Example[]
	curated_examples: CuratedExample[]
	occurrences: number
}

type SearchFilter = {
	[key: string]: string
}

type ConceptSearchFilter = {
	q: string
	scope: 'stems' | 'glosses' | 'all'
	category: string
}

type CuratedExample = {
	reference: Reference
	encoding: SimplifiedSemanticEncoding
	sentence: string
}

type Example = {
	reference: Reference
	context_arguments: Map<string, string>
}

type Reference = {
	source: string //TODO: would like to use `typeof sources[number]` but importing sources breaks other types
	book: string //TODO: would like to use `typeof books[number]` but importing books breaks other types
	chapter: number
	verse: number
}

type SimplifiedSemanticEncoding = SimplifiedEncodingPhrase[]

type SimplifiedEncodingPhrase = {
	part_of_speech: string
	role: string
	word: string
}

type SourceData = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
	phase_1_encoding: string
	semantic_encoding: string
	notes: string
}

type SourceEntity = {
	label: string
	features: string
	sense: string
	entity: string
}

type SemanticEncoding = SourceEntity[]
