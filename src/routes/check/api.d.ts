type CheckResponse = {
	status: CheckStatus
	tokens: SimpleToken[]
	back_translation: string
}

type CheckStatus = 'ok' | 'error' | 'warning'

type SimpleToken = TokenBase & {
	lookup_results: SimpleLookupResult[]
	complex_pairing: SimpleToken | null
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

type SimpleLookupResult = LookupWord & {
	lexicon_id: number
	form: string
	// TODO include features
	ontology_id: number
	sense: string
	level: number
	gloss: string
	categorization: string
	how_to_entries: HowToEntry[]
	case_frame: SimpleCaseFrameResult
}

type SimpleCaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	valid_arguments: SimpleRoleArgResult
	extra_arguments: SimpleRoleArgResult
	missing_arguments: RoleTag[]
}

type SimpleRoleArgResult = {
	[role: RoleTag]: string
}