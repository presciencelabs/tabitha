type ConceptUpdateData = ConceptKey & {
	level: string
	gloss: string
	brief_gloss: string
	categories: string[]
	curated_examples: string
}

type ConceptCreateData = ConceptUpdateData