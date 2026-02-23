
// Checker types

type CheckerResult = {
	status: AnalyzerStatus
	tokens: CheckerToken[]
	back_translation: string
}

type CheckerToken = {
	token: string
	type: string
	tag: Record<string, string>
	messages: CheckerMessage[]
	applied_rules: string[]
	lookup_results: CheckerLookupResult[]
	pairing: CheckerToken | null
	pairing_type: 'none' | 'complex' | 'literal'
	pronoun: CheckerToken | null
	sub_tokens: CheckerToken[]
}

type CheckerMessage = {
	label: 'error' | 'warning' | 'suggest' | 'info'
	severity: number
	message: string
	rule_id: string
}

type CheckerLookupResult = {
	stem: string
	sense: string
	part_of_speech: string
	form: string
	level: number
	gloss: string
	categorization: string
	ontology_status: 'in ontology' | 'approved' | 'suggested' | 'not used' | 'unknown'
	// how_to_entries: HowToEntry[]
	case_frame: EditorCaseFrame
}

type EditorCaseFrame = {
	status: 'unchecked' | 'valid' | 'invalid'
	valid_arguments: Record<RoleTag, string>
	extra_arguments: Record<RoleTag, string>
	missing_arguments: RoleTag[]
	possible_roles: RoleTag[]
	required_roles: RoleTag[]
}

type RoleTag = string
