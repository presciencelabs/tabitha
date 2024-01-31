type TokenType = 'Error' | 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Pairing'

type Token = {
	token: string;
	type: TokenType;
	message: string;
	lookup_term: string;
	pairing_left: Token?;
	pairing_right: Token?;
}

type DbRowConcept = {
	id: string
	part_of_speech: string
	stem: string
	level: string
}

type LookupTerm = string

type LookupResult<T> = {
	term: LookupTerm
	matches: T[]
}

interface OntologyResult extends DbRowConcept {
	sense: string
}

type Stem = string

type DbRowInflection = {
	stem: Stem
	part_of_speech: string
}
