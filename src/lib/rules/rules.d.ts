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

interface TokenRuleBase {
	name?: string
	trigger?: TokenFilterJson
	context?: TokenContextFilterJson
	comment?: string
}

interface LookupRuleJson extends TokenRuleBase {
	lookup: string
	combine?: number
}

interface PartOfSpeechRuleJson extends TokenRuleBase {
	category: string
	remove: string
}

interface TransformRuleJson extends TokenRuleBase {
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

type CheckerRuleJson = TokenRuleBase & {
	[key in MessageLabel]?: CheckerActionJson
}