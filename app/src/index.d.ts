type TokenType = 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Clause' |'Added'

type Token = {
	token: string
	type: TokenType
	error_message: string
	suggest_message: string
	tag: string
	lookup_terms: LookupTerm[]
	lookup_results: LookupResult[]
	complex_pairing: Token | null
	pronoun: Token | null
	sub_tokens: Token[]
}

type Clause = Token

type Sentence = {
	clause: Clause,
}

type LookupTerm = string

type LookupResponse<T> = {
	term: LookupTerm
	matches: T[]
}

interface LookupWord {
	stem: string
	part_of_speech: string
}

interface LookupResult extends LookupWord {
	form: string
	concept: OntologyResult | null
	how_to: HowToResult[]
	case_frame: CaseFrameResult
}

interface OntologyResult extends LookupWord {
	id: string
	sense: string
	level: number
	gloss: string
	categorization: string
}

interface FormResult extends LookupWord {
	form: string
}

interface HowToResult extends LookupWord, HowToResponse {
	sense: string
}

type HowToResponse = {
	term: string
	part_of_speech: string
	structure: string
	pairing: string
	explication: string
}

type DbRowInflection = {
	stem: string
	part_of_speech: string
	inflections: string
}

type TokenFilter = (token: Token) => boolean
type LookupFilter = (concept: LookupResult) => boolean
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

type RoleTag = string
type WordSense = string
type WordStem = string

type ArgumentRoleRule = {
	role_tag: RoleTag
	trigger: TokenFilter
	context: TokenContextFilter
	action: RoleRuleAction
	missing_message: string
}

type ArgumentRulesForSense = {
	sense: WordSense
	rules: ArgumentRoleRule[]
	other_required: RoleTag[]
	other_optional: RoleTag[]
	patient_clause_type: RoleTag
}

type RoleRuleAction = (tokens: Token[], role_match: RoleMatchResult) => void

type ArgumentMatchFilter = (tokens: Token[], role_matches: RoleMatchResult[]) => boolean

type RoleMatchResult = {
	role_tag: RoleTag
	success: boolean
	trigger_index: number
	context_indexes: number[]
}

type CaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	rule: ArgumentRulesForSense
	valid_arguments: RoleMatchResult[]
	extra_arguments: RoleMatchResult[]
	missing_arguments: RoleTag[]
}
