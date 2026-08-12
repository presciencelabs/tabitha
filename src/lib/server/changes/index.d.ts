type ConceptUpdateData = ConceptKey & {
	level: string
	gloss: string
	brief_gloss: string
	categories: string[]
	curated_examples: string
}

type ConceptCreateData = ConceptUpdateData

type DbOntologyChange = {
	id: number
	concept_stem: string
	concept_sense: string
	concept_part_of_speech: string
	data: string
	action: OntologyChangeAction
	// suggested_by_email: UserEmail | null
	// suggested_date: string | null
	approved_by_email: UserEmail | null
	approved_date: string | null
	applied_date: string | null
	version: string | null
}

type OntologyChange = {
	id: number
	concept: ConceptKey
	data: OntologyChangeDataFields
	action: OntologyChangeAction
	// suggested_by: WorkflowInfo | null
	approved_by: WorkflowInfo | null
	applied_date: Date | null
	version: string | null
}

type OntologyChangeAction = 'create' | 'update' // TODO | 'delete'

type OntologyChangeDataFields = {
	level?: FieldChangeData<string>
	gloss?: FieldChangeData<string>
	brief_gloss?: FieldChangeData<string>
	categories?: FieldChangeData<string[]>
	curated_examples?: FieldChangeData<string>
}

type FieldChangeData<T> = {
	old?: T
	value: T
}

type WorkflowInfo = {
	email: UserEmail
	date: Date
}