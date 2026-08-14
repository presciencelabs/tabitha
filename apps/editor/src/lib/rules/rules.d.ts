type TokenFilter = (token: Token) => boolean
type LookupFilter = (concept: LookupResult) => boolean
type TokenContextFilter = (tokens: Token[], start_index: number) => ContextFilterResult

type ContextFilterResult = {
	success: boolean
	context_indexes: number[]
	subtoken_indexes: number[]
}

type TokenTransform = (token: Token) => Token

type RuleTriggerContext = {
	trigger_token: Token
	trigger_index: number
	tokens: Token[]
	context_indexes: number[]
	subtoken_indexes: number[]
	rule_id: string
}

type RuleAction = (trigger_context: RuleTriggerContext) => number

type TokenRuleCore = {
	trigger: TokenFilter
	context: TokenContextFilter
	action: RuleAction
}

type TokenRule = TokenRuleCore & {
	id: string
	name: string
}

type BuiltInRule = {
	name: string
	comment: string
	rule: TokenRuleCore
}

// Json structures
type TagFilterJson = Tag | string

interface TokenFilterJsonBase {
	token?: string
	type?: string
	tag?: TagFilterJson | TagFilterJson[]
	stem?: string
	category?: string
	level?: string
	form?: string
}

type TokenFilterJson = 'none' | 'all' | TokenFilterJsonBase

type SkipGroup = string
type SkipJsonSingle = TokenFilterJson | SkipGroup
type SkipJson = SkipJsonSingle | SkipJsonSingle[]

interface TokenFilterWithSkipJson extends TokenFilterJsonBase {
	skip?: SkipJson
}

type TokenFilterJsonForContext = TokenFilterWithSkipJson | TokenFilterWithSkipJson[]

type TokenContextFilterJson = {
	precededby?: TokenFilterJsonForContext
	followedby?: TokenFilterJsonForContext
	notprecededby?: TokenFilterJsonForContext
	notfollowedby?: TokenFilterJsonForContext
	subtokens?: TokenFilterJsonForContext
}

type TokenTransformJson = {
	type?: TokenType
	tag?: Tag
	remove_tag?: string | string[]
	function?: Tag
}

interface TokenRuleJsonBase {
	name?: string
	trigger?: TokenFilterJson
	context?: TokenContextFilterJson
	comment?: string
}

interface LookupRuleJson extends TokenRuleJsonBase {
	lookup: string
	combine?: number
}

interface PartOfSpeechRuleJson extends TokenRuleJsonBase {
	category: string
	remove: string
}

interface TransformRuleJson extends TokenRuleJsonBase {
	transform?: TokenTransformJson
	context_transform?: TokenTransformJson | TokenTransformJson[]
	subtoken_transform?: TokenTransformJson | TokenTransformJson[]
}

type CheckerActionJson = {
	on?: string
	precededby?: string
	followedby?: string
	message: string
}

type CheckerRuleJson = TokenRuleJsonBase & {
	[key in MessageLabel]?: CheckerActionJson
}