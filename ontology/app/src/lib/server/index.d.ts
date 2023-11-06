type DbRowConcept = {
	id: string
	brief_gloss: string
	categories: string
	examples: string
	exhaustive_examples: string
	gloss: string
	level: string
	occurrences: string
	part_of_speech: string
	roots: string
}

interface TransformedConcept extends DbRowConcept {
	categories: string[]
	examples: Example[]
	exhaustive_examples: ExhaustiveExample[]
	occurrences: number
}

interface AugmentedConcept extends TransformedConcept {
	sense: string
}

interface Concept extends AugmentedConcept {}

type Example = {
	reference: Reference
	semantic_representation: SemanticRepresentation
	sentence: string
}

type ExhaustiveExample = {
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
