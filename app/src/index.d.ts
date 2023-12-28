type Token = string

type CheckedToken = {
	token: Token
	message: string
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
