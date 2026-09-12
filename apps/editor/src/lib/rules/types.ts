import type { CheckerTokenType, CheckerMessageLabel } from '@tabitha/types/editor'
import type { Token, Tag, LookupResult } from '$lib/types'

export type TokenFilter = (token: Token) => boolean
export type TokenTransform = (token: Token) => Token

export type LookupFilter = (concept: LookupResult) => boolean

export type TokenContextFilter = (tokens: Token[], start_index: number) => ContextFilterResult
export type ContextFilterResult = {
	success: boolean
	context_indexes: number[]
	subtoken_indexes: number[]
}

export type TokenRuleCore = {
	trigger: TokenFilter
	context: TokenContextFilter
	action: RuleAction
}

export type RuleTriggerContext = {
	trigger_token: Token
	trigger_index: number
	tokens: Token[]
	context_indexes: number[]
	subtoken_indexes: number[]
	rule_id: string
}

export type RuleAction = (trigger_context: RuleTriggerContext) => number

export type TokenRule = TokenRuleCore & {
	id: string
	name: string
}

export type BuiltInRule = {
	name: string
	comment: string
	rule: TokenRuleCore
}

//===============
// Json structures

export type TagFilterJson = Tag | string

export type TokenFilterJsonBase = {
	token?: string
	type?: string
	tag?: TagFilterJson | TagFilterJson[]
	stem?: string
	category?: string
	level?: string
	form?: string
}

export type TokenFilterJson = 'none' | 'all' | TokenFilterJsonBase

export type SkipGroup = string
export type SkipJsonSingle = TokenFilterJson | SkipGroup
export type SkipJson = SkipJsonSingle | SkipJsonSingle[]

export type TokenFilterWithSkipJson = TokenFilterJsonBase & {
	skip?: SkipJson
}

export type TokenFilterJsonForContext = TokenFilterWithSkipJson | TokenFilterWithSkipJson[]

export type TokenContextFilterJson = {
	precededby?: TokenFilterJsonForContext
	followedby?: TokenFilterJsonForContext
	notprecededby?: TokenFilterJsonForContext
	notfollowedby?: TokenFilterJsonForContext
	subtokens?: TokenFilterJsonForContext
}

export type TokenTransformJson = {
	type?: CheckerTokenType
	tag?: Tag
	remove_tag?: string | string[]
	function?: Tag
}

export type TokenRuleJsonBase = {
	name?: string
	trigger?: TokenFilterJson
	context?: TokenContextFilterJson
	comment?: string
}

export type LookupRuleJson = TokenRuleJsonBase & {
	lookup: string
	combine?: number
}

export type PartOfSpeechRuleJson = TokenRuleJsonBase & {
	category: string
	remove: string
}

export type TransformRuleJson = TokenRuleJsonBase & {
	transform?: TokenTransformJson
	context_transform?: TokenTransformJson | TokenTransformJson[]
	subtoken_transform?: TokenTransformJson | TokenTransformJson[]
}

export type CheckerActionJson = {
	on?: string
	precededby?: string
	followedby?: string
	message: string
}

export type CheckerRuleJson = TokenRuleJsonBase & {
	[key in CheckerMessageLabel]?: CheckerActionJson
}
