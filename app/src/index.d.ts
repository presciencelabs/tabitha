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

type TokenFilter = (token: Token) => boolean

type TokenContextFilter = (tokens: Token[], trigger_index: number) => boolean

type TokenTransform = (token: Token) => Token

type CheckerAction = {
	preceded_by: string?;
	followed_by: string?;
	message: string
}

interface TokenRule {
	name: string
	trigger: TokenFilter
	context: TokenContextFilter
}

interface TransformRule extends TokenRule {
	transform: TokenTransform
}

interface CheckerRule extends TokenRule {
	require: CheckerAction
}
