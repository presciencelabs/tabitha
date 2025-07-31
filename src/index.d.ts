type TokenType = 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Clause' | 'Added' | 'Phrase'

type TokenBase = {
	token: string
	type: TokenType
	tag: Tag
	messages: Message[]
}

type Token = TokenBase & {
	specified_sense: string
	lookup_terms: LookupTerm[]
	lookup_results: LookupResult[]
	pairing: Token | null
	pairing_type: PairingType
	pronoun: Token | null
	sub_tokens: Token[]
}

type PairingType = 'none' | 'complex' | 'literal'

type Tag = { [tag: string]: string }

type Clause = Token
type Phrase = Token

type Sentence = {
	clause: Clause
}

// Messages
type MessageLabel = 'error' | 'warning' | 'suggest' | 'info'

type MessageType = {
	label: MessageLabel
	severity: number
}

type Message = MessageType & {
	message: string
	// TODO #101 add optional fix_action structure
}

type MessageInfo = {
	token_to_flag?: Token
	plain?: boolean
} & {
	[key in MessageLabel]?: string
}

// Lookup values
type LookupTerm = string

type LookupWord = {
	stem: string
	part_of_speech: string
}

type LookupResult = LookupWord & {
	lexicon_id: number
	form: string
	// TODO include features
	ontology_id: number
	sense: string
	level: number
	gloss: string
	categorization: string
	how_to_entries: HowToEntry[]
	case_frame: CaseFrame
}

type HowToEntry = {
	structure: string
	pairing: string
	explication: string
}