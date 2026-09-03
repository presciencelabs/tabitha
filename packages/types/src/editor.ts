import type { HowToEntry, LookupWord, OntologyStatus } from './ontology'
import type { CategoryName, EntityFeature, NounListEntry, PairingType, SourceConcept } from './source'

export type TokenType =
	| 'Punctuation'
	| 'Note'
	| 'FunctionWord'
	| 'Word'
	| 'Clause'
	| 'Added'
	| 'Phrase'
	| 'Gap'

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

export type TokenBase = {
	token: string
	type: TokenType
	tag: Tag
	messages: Message[]
	applied_rules: string[]
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
	pairing_type: PairingType | null
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

/** The response shape of editor's `GET /check` endpoint, consumed by both `apps/editor` and `apps/sources`. */
export type CheckResponse = {
	status: CheckStatus
	tokens: SimpleToken[]
	back_translation: string
}

export type AnalysisNote = string

export type SimpleSourceEntity = {
	category: CategoryName
	value: string
	features: EntityFeature[]
	noun_list_index: string | null
	concept: SourceConcept | null
	pairing_concept: SourceConcept | null
	pairing_type: PairingType | null
}

/** The response shape of editor's `GET /analyze` endpoint, consumed by both `apps/editor` and `apps/sources`. */
export type SimpleSourceData = {
	notes: AnalysisNote[]
	source_entities: SimpleSourceEntity[]
	noun_list: NounListEntry[]
}
