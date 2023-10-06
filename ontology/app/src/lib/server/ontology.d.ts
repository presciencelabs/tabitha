type DbRow = {
	id: number,
	roots: string,
	part_of_speech: string,
	occurrences: string,
	gloss: string,
	brief_gloss: string,
	categories: string,
	examples: string,
	exhaustive_examples: string,
	level: string,
}

interface Concept extends DbRow {
	examples: Example[],
}

type Example = {
	references: string[],
	semantic_representation: string,
	sentence: string,
}