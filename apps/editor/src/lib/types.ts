import type { ConceptKey, PairingType } from '@tabitha/types'
import type { CheckerTokenType, CheckerMessage, CheckerMessageLabel, EditorCheckResult, CheckerLookupResult } from '@tabitha/types/editor'
import type { CaseFrame } from '$lib/rules/case_frame/types'

export type LookupTerm = string

export type LookupWord = Pick<ConceptKey, 'stem' | 'part_of_speech'>

export type LookupResult = Omit<CheckerLookupResult, 'case_frame'> & {
	case_frame: CaseFrame
}

export type Tag = Record<string, string>

export type Token = {
	token: string
	type: CheckerTokenType
	tag: Tag
	messages: CheckerMessage[]
	applied_rules: string[]
	specified_sense: string
	lookup_terms: LookupTerm[]
	lookup_results: LookupResult[]
	pairing: Token | null
	pairing_type: PairingType | null
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
	[key in CheckerMessageLabel]?: string
}

export type AiAssistResult = {
	status: 'ok' | 'error'
	phase_1: string
	notes: string[]
	check: EditorCheckResult
	message?: string
}
