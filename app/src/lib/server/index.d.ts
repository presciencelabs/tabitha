type DbRowConcept = {
	id: string
	stem: string
	part_of_speech: string
	level: string
	categorization: string
	examples: string
	curated_examples: string
	gloss: string
	brief_gloss: string
	occurrences: string
}

interface TransformedConcept extends DbRowConcept {
	categories: string[]
	examples: Example[]
	curated_examples: CuratedExample[]
	occurrences: number
}

interface AugmentedConcept extends TransformedConcept {
	sense: string
}

interface Concept extends AugmentedConcept {}

type CuratedExample = {
	reference: Reference
	semantic_representation: SemanticRepresentation
	sentence: string
}

type Example = {
	reference: Reference
	unknown_encoding: string
}

type Reference = {
	source: string //TODO: would like to use `typeof sources[number]` but importing sources breaks other types
	book: string //TODO: would like to use `typeof books[number]` but importing books breaks other types
	chapter: number
	verse: number
}

type SemanticRepresentation = Phrase[]

type Phrase = {
	part_of_speech: string
	role: string
	word: string
}
