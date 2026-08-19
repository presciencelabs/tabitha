import type { HowToEntry, LookupResult, LookupTerm, LookupWord, OntologyStatus } from './ontology'

export type TokenType =
	| 'Punctuation'
	| 'Note'
	| 'FunctionWord'
	| 'Word'
	| 'Clause'
	| 'Added'
	| 'Phrase'
	| 'Gap'

export type PairingType = 'none' | 'complex' | 'literal'

export type Tag = Record<string, string>

export type MessageLabel = 'error' | 'warning' | 'suggest' | 'info'

export type MessageType = {
	label: MessageLabel
	severity: number
}

export type Message = MessageType & {
	message: string
	rule_id: string
}

export type MessageInfo = {
	token_to_flag?: Token
	plain?: boolean
} & {
	[key in MessageLabel]?: string
}

export type TokenBase = {
	token: string
	type: TokenType
	tag: Tag
	messages: Message[]
	applied_rules: string[]
}

export type Token = TokenBase & {
	specified_sense: string
	lookup_terms: LookupTerm[]
	lookup_results: LookupResult[]
	pairing: Token | null
	pairing_type: PairingType
	pronoun: Token | null
	sub_tokens: Token[]
}

export type Clause = Token
export type Phrase = Token

export type Sentence = {
	clause: Clause
}

export type RoleTag = string

export type CaseFrameStatus = 'unchecked' | 'valid' | 'invalid'

export type CheckStatus = 'ok' | 'error' | 'warning'

export type SimpleRoleArgResult = {
	[role: RoleTag]: string
}

export type SimpleCaseFrame = {
	status: CaseFrameStatus
	valid_arguments: SimpleRoleArgResult
	extra_arguments: SimpleRoleArgResult
	missing_arguments: RoleTag[]
	possible_roles: RoleTag[]
	required_roles: RoleTag[]
}

export type SimpleLookupResult = LookupWord & {
	form: string
	sense: string
	level: number
	gloss: string
	categorization: string
	ontology_status: OntologyStatus
	how_to_entries: HowToEntry[]
	case_frame: SimpleCaseFrame
}

export type SimpleToken = TokenBase & {
	lookup_results: SimpleLookupResult[]
	pairing: SimpleToken | null
	pairing_type: PairingType
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

/** The response shape of editor's `GET /check` endpoint, consumed by both `apps/editor` and `apps/sources`. */
export type CheckResponse = {
	status: CheckStatus
	tokens: SimpleToken[]
	back_translation: string
}
