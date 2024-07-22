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

// Messages
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

// Lookup values
type LookupTerm = string

interface LookupWord {
	stem: string
	part_of_speech: string
}

interface LookupResult extends LookupWord {
	lexicon_id: number
	form: string
	// TODO include features
	ontology_id: number
	sense: string
	level: number
	gloss: string
	categorization: string
	how_to_entries: HowToEntry[]
	case_frame: CaseFrameResult
}

type HowToEntry = {
	structure: string
	pairing: string
	explication: string
}

// External API Responses
interface LexicalFormResult extends LookupWord {
	id: number
	form: string
}

interface OntologyResult extends LookupWord {
	id: string
	sense: string
	level: number
	gloss: string
	categorization: string
}

interface HowToResult extends HowToEntry {
	term: string
	part_of_speech: string
}

// Token rules
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

// Case frames
type RoleTag = string
type WordSense = string
type WordStem = string

type RoleRulePreset = [string, (preset_value: any, role_tag: RoleTag) => any]

type ArgumentRoleRule = {
	role_tag: RoleTag
	// if the trigger rule is relative to the trigger word, this index tells the rule which context index the argument is at
	relative_context_index: number
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

type RoleUsageInfo = {
	possible_roles: string[]
	required_roles: string[]
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

// Internal API response
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

interface SimpleLookupResult extends LookupWord {
	lexicon_id: number
	form: string
	// TODO include features
	ontology_id: number
	sense: string
	level: number
	gloss: string
	categorization: string
	how_to_entries: HowToEntry[]
	case_frame: SimpleCaseFrameResult
}

type SimpleCaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	valid_arguments: SimpleRoleArgResult
	extra_arguments: SimpleRoleArgResult
	missing_arguments: RoleTag[]
}

type SimpleRoleArgResult = {
	[role: RoleTag]: string
}
