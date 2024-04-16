type TokenType = 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Clause' |'Added'

interface MessagedToken {
	token: string
	type: TokenType
	tag: Tag
	messages: Message[]
}

interface Token extends MessagedToken {
	specified_sense: string
	lookup_terms: LookupTerm[]
	lookup_results: LookupResult[]
	complex_pairing: Token | null
	pronoun: Token | null
	sub_tokens: Token[]
}

type Tag = { [tag: string]: string }

type Clause = Token

type Sentence = {
	clause: Clause
}

type MessageLabel = 'error' | 'warning' | 'suggest' | 'info'

interface MessageType {
	label: MessageLabel
	severity: number
}

interface Message extends MessageType {
	message: string
	// TODO #101 add optional fix_action structure
}

type MessageInfo = {
	// TODO find a more elegant way to do this?
	error?: string
	warning?: string
	suggest?: string
	info?: string
	token_to_flag?: Token
	plain?: boolean
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

interface DbRowInflection extends LookupWord {
	inflections: string
}

type TokenFilter = (token: Token) => boolean
type LookupFilter = (concept: LookupResult) => boolean
type TokenContextFilter = (tokens: Token[], start_index: number) => ContextFilterResult

type ContextFilterResult = {
	success: boolean
	context_indexes: number[]
	subtoken_indexes: number[]
}

type TokenTransform = (token: Token) => Token

type CheckerAction = {
	on: string?;
	precededby: string?;
	followedby: string?;
	message: string
}

type RuleTriggerContext = {
	trigger_token: Token
	trigger_index: number
	tokens: Token[]
	context_indexes: number[]
	subtoken_indexes: number[]
}

type RuleAction = (trigger_context: RuleTriggerContext) => number

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
	trigger_rule: TokenRule
	missing_message: string
	extra_message: string
}

type ArgumentRulesForSense = {
	sense: WordSense
	rules: ArgumentRoleRule[]
	other_required: RoleTag[]
	other_optional: RoleTag[]
	patient_clause_type: RoleTag
}

type ArgumentMatchFilter = (role_matches: RoleMatchResult[]) => boolean

type RoleMatchResult = {
	role_tag: RoleTag
	success: boolean
	trigger_context: RuleTriggerContext
	rule: ArgumentRoleRule
}

type CaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	valid_arguments: RoleMatchResult[]
	extra_arguments: RoleMatchResult[]
	missing_arguments: ArgumentRoleRule[]
}

type CheckResponse = {
	has_error: boolean
	tokens: SimpleToken[]
	back_translation: string
}

interface SimpleToken extends MessagedToken {
	lookup_results: SimpleLookupResult[]
	complex_pairing: SimpleToken | null
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

type SimpleLookupResult = {
	concept: string
	part_of_speech: string
	form: string
	level: number
	gloss: string
	categorization: string
	how_to_hints: SimpleHowToResult[]
	case_frame: SimpleCaseFrameResult
}

type SimpleHowToResult = {
	structure: string
	pairing: string
	explication: string
}

type SimpleCaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	valid_arguments: RoleTag[]
	extra_arguments: RoleTag[]
	missing_arguments: RoleTag[]
}
