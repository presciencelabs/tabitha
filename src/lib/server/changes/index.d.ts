type ConceptUpdateData = ConceptKey & {
	level: string
	gloss: string
	brief_gloss: string
	categorization: string
	curated_examples: string
}

type ConceptCreateData = ConceptUpdateData