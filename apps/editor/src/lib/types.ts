import type { LookupWord, OntologyStatus, HowToEntry, TokenBase, PairingType } from '@tabitha/types'
import type { CaseFrame, CaseFrameStatus, RoleTag } from '$lib/rules/case_frame/types'

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

export type CheckStatus = 'ok' | 'error' | 'warning'

export type SimpleToken = TokenBase & {
	lookup_results: SimpleLookupResult[]
	pairing: SimpleToken | null
	pairing_type: PairingType
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

export type SimpleLookupResult = LookupWord & {
	form: string
	// TODO include features
	sense: string
	level: number
	gloss: string
	categorization: string
	ontology_status: OntologyStatus
	how_to_entries: HowToEntry[]
	case_frame: SimpleCaseFrame
}

export type SimpleCaseFrame = {
	status: CaseFrameStatus
	valid_arguments: SimpleRoleArgResult
	extra_arguments: SimpleRoleArgResult
	missing_arguments: RoleTag[]
	possible_roles: RoleTag[]
	required_roles: RoleTag[]
}

export type SimpleRoleArgResult = {
	[role: RoleTag]: string
}
