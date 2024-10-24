type LexicalFormResult = LookupWord & {
	id: number
	form: string
}

type OntologyResult = LookupWord & {
	id: string
	sense: string
	level: number
	gloss: string
	categorization: string
}

type HowToResult = HowToEntry & {
	term: string
	part_of_speech: string
}
