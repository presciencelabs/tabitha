type DbRowConcept = {
	id: string
	roots: string
	part_of_speech: string
	occurrences: string
	gloss: string
	brief_gloss: string
	categories: string // TODO: theta_grids are only relevant for verbs and adjectives, check the Ontology db for verification, look at SourceAndTargetView.cppL3033-3068
	examples: string
	exhaustive_examples: string
	level: string
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

type Example = {
	references: string[]
	semantic_representation: string
	sentence: string
}
