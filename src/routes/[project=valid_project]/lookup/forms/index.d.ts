type DbRowLexicon = {
	id: number
	project: string
	stem: string
	part_of_speech: string
	gloss: string
	features: string
	constituents: string
	forms: string
}

type LexicalForm = {
	id: number
	stem: string
	part_of_speech: string
	form: string
}

type DbRowFormNames = {
	project: string
	part_of_speech: string
	name: string
	position: number
}

type FormNameMap = {
	part_of_speech: string
	name: string
	position: number
}