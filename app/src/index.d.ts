type TokenType = 'Error' | 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Pairing'

type Token = {
	token: string;
	type: TokenType;
	message: string;
	lookup_term: string;
	pairing_left: Token?;
	pairing_right: Token?;
}

type LookupTerm = string

type LookupResult<T> = {
	term: LookupTerm
	matches: T[]
}

type OntologyResult = {
	id: string
	stem: string
	sense: string
	part_of_speech: string
	level: number
	gloss: string
}

type Stem = string

type DbRowInflection = {
	stem: Stem
	part_of_speech: string
}
