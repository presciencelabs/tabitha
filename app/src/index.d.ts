type TokenType = 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Clause' |'Added'

type Token = {
	token: string
	type: TokenType
	error_message: string
	suggest_message: string
	tag: string
	lookup_terms: LookupTerm[]
	form_results: FormResult[]
	lookup_results: OntologyResult[]
	complex_pairing: Token?;
	pronoun: Token?;
	sub_tokens: Token[]
}

type Clause = Token

type Sentence = {
	clause: Clause,
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
	categorization: string
}

type FormResult = {
	stem: string
	part_of_speech: string
	form: string
}

type DbRowInflection = {
	stem: string
	part_of_speech: string
	inflections: string
}

type TokenFilter = (token: Token) => boolean
type LookupFilter = (concept: OntologyResult) => boolean
type TokenContextFilter = (tokens: Token[], start_index: number) => ContextFilterResult

type ContextFilterResult = {
	success: boolean
	indexes: number[]
}

type TokenTransform = (token: Token) => Token

type CheckerAction = {
	precededby: string?;
	followedby: string?;
	message: string
}

type RuleAction = (tokens: Token[], trigger_index: number, context_indexes: number[]) => number

type TokenRule = {
	trigger: TokenFilter
	context: TokenContextFilter
	action: RuleAction
}

type BuiltInRule = {
	name: string
	comment: string
	rule: TokenRule
}
