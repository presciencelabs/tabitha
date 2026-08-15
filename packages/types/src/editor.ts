import type { LookupResult, LookupTerm } from './ontology'

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

export type BacktranslationResult = {
	text: string
	tokens: Token[]
}

export type RuleCheckStatus = 'ok' | 'warning' | 'error'

export type CheckApiResponse = {
	status: RuleCheckStatus
	tokens: Token[]
	backtranslation?: BacktranslationResult
	messages: Message[]
}
