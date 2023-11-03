type DbRowConcept = {
	id: string
	brief_gloss: string
	categories: string // TODO: theta_grids are only relevant for verbs and adjectives, check the Ontology db for verification, look at SourceAndTargetView.cppL3033-3068
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
	exhaustive_examples: string[]
	occurrences: number
}

interface AugmentedConcept extends TransformedConcept {
	sense: string
}

interface Concept extends AugmentedConcept {}

// 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
type Example = {
	reference: Reference
	semantic_representation: SemanticRepresentation
	sentence: string
}

type Reference = {
	source: string //TODO: would like to use `typeof sources[number]` but importing sources breaks other types
	book: string //TODO: would like to use `typeof books[number]` but importing books breaks other types
	chapter: number
	verse: number
}

// '(NPp|baby|)|(VP|be|)|(APP|beautiful|)'
type SemanticRepresentation = Phrase[]

// (NPp|baby|) => { part_of_speech: 'NP', role: 'p', word: 'baby' }
// (VP|be|) => { part_of_speech: 'VP', role: '', word: 'be' }
// (APP|beautiful|) => { part_of_speech: 'AP', role: 'P', word: 'beautiful' }
type Phrase = {
	part_of_speech: string
	role: string
	word: string
}
