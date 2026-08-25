import type { CheckResponse, HowToEntry, LookupTerm, LookupWord, MessageLabel, OntologyStatus, PairingType, TokenBase } from '@tabitha/types'
import type { CaseFrame } from '$lib/rules/case_frame/types'

export type LookupResult = LookupWord & {
	form: string
	sense: string
	level: number
	gloss: string
	categorization: string
	ontology_status: OntologyStatus
	how_to_entries: HowToEntry[]
	case_frame: CaseFrame
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

export type MessageInfo = {
	token_to_flag?: Token
	plain?: boolean
} & {
	[key in MessageLabel]?: string
}

export type AiAssistResult = {
	status: 'ok' | 'error'
	phase_1: string
	notes: string[]
	check: CheckResponse
	message?: string
}
