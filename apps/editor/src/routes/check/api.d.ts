type CheckResponse = {
	status: CheckStatus
	tokens: SimpleToken[]
	back_translation: string
}

type CheckStatus = 'ok' | 'error' | 'warning'

type SimpleToken = TokenBase & {
	lookup_results: SimpleLookupResult[]
	pairing: SimpleToken | null
	pairing_type: PairingType
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

type SimpleLookupResult = LookupWord & {
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

type SimpleCaseFrame = {
	status: CaseFrameStatus
	valid_arguments: SimpleRoleArgResult
	extra_arguments: SimpleRoleArgResult
	missing_arguments: RoleTag[]
	possible_roles: RoleTag[]
	required_roles: RoleTag[]
}

type SimpleRoleArgResult = {
	[role: RoleTag]: string
}