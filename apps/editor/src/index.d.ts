import type {
	TokenType as _TokenType,
	TokenBase as _TokenBase,
	Token as _Token,
	PairingType as _PairingType,
	Tag as _Tag,
	Clause as _Clause,
	Phrase as _Phrase,
	Sentence as _Sentence,
	MessageLabel as _MessageLabel,
	MessageType as _MessageType,
	Message as _Message,
	MessageInfo as _MessageInfo,
	LookupTerm as _LookupTerm,
	LookupWord as _LookupWord,
	OntologyStatus as _OntologyStatus,
	HowToEntry as _HowToEntry,
} from '@tabitha/types'

declare global {
	type TokenType = _TokenType
	type TokenBase = _TokenBase
	type Token = _Token
	type PairingType = _PairingType
	type Tag = _Tag
	type Clause = _Clause
	type Phrase = _Phrase
	type Sentence = _Sentence
	type MessageLabel = _MessageLabel
	type MessageType = _MessageType
	type Message = _Message
	type MessageInfo = _MessageInfo
	type LookupTerm = _LookupTerm
	type LookupWord = _LookupWord
	type OntologyStatus = _OntologyStatus
	type HowToEntry = _HowToEntry

	type LookupResult = LookupWord & {
		form: string
		sense: string
		level: number
		gloss: string
		categorization: string
		ontology_status: OntologyStatus
		how_to_entries: HowToEntry[]
		case_frame: CaseFrame
	}
}

export {}