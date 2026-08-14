export type PartOfSpeech =
	| 'Noun'
	| 'Verb'
	| 'Adjective'
	| 'Adverb'
	| 'Adposition'
	| 'Conjunction'
	| 'Particle'
	| 'Phrasal'
	| 'Function Word'

export type OntologyStatus =
	| 'in ontology'
	| 'approved'
	| 'suggested'
	| 'not used'
	| 'function_word'

export type ConceptKey = {
	stem: string
	sense: string
	part_of_speech: string
}

export type DbRowConcept = ConceptKey & {
	id: string
	level: number
	categorization: string
	examples: string
	curated_examples: string
	gloss: string
	brief_gloss: string
	occurrences: number
}

export type SimplificationHint = ConceptKey & {
	structure: string
	pairing: string
	explication: string
	ontology_status: OntologyStatus
	level: number
}

export interface Concept extends Omit<DbRowConcept, 'level' | 'curated_examples'> {
	level: string
	categories: string[]
	curated_examples: CuratedExample[]
	curated_examples_raw: string
	occurrences: number
	status: OntologyStatus
	how_to_hints: SimplificationHint[]
	pending_changes: OntologyChange[]
}

export type ConceptSearchFilter = {
	q: string
	scope: 'stems' | 'glosses' | 'all' | 'english' | 'semantic'
	category: string
}

export type Reference = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
}

export type CategoryName = string
export type FeatureName = string
export type FeatureValue = string

export type SimpleEncodingFeature = {
	code: string
	value: string
}

export type SimplifiedEncodingEntity = {
	category: CategoryName
	word: string | undefined
	feature: SimpleEncodingFeature | undefined
}

export type SimplifiedSemanticEncoding = SimplifiedEncodingEntity[]

export type CuratedExample = {
	reference: Reference
	encoding: SimplifiedSemanticEncoding
	sentence: string
}

export type DbRowExample = {
	ref_type: string
	ref_id_primary: string
	ref_id_secondary: number
	ref_id_tertiary: number
	context_json: string
}

export type ContextArgumentName = string
export type ContextArgumentValue = string
export type ContextArguments = Record<ContextArgumentName, ContextArgumentValue>

export type SourceStatus =
	| 'Not Started'
	| 'Initial Analysis in Progress'
	| 'Initial Analysis Complete'
	| 'Final Review in Progress'
	| 'Ready to Translate'

export type Example = {
	reference: Reference
	context: ContextArguments
	book_status: SourceStatus
}

export type ContextArgumentMap = Map<string, ContextArgumentName[]>

export type Option = ContextArgumentValue
export type Options = Set<Option>
export type FilterMap = Map<ContextArgumentName, Options>
export type FilterRulesMap = Map<string, FilterMap>

export type TargetTextResult = {
	text: string
	audience: string
}

export type SourceConcept = {
	stem: string
	sense: string
	part_of_speech: string
}

export type EntityFeature = {
	name: FeatureName
	value: FeatureValue
}

export type SourceEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	feature_codes: string
	features: EntityFeature[]
	concept: SourceConcept | null
	pairing_concept: SourceConcept | null
}

export type SourceData = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
	phase_1_encoding: string
	semantic_encoding: string
	parsed_semantic_encoding: SourceEntity[]
	status: SourceStatus
	notes: string
}

export type StatusApiResult = {
	status: SourceStatus
}

export type Book = Record<number, string>

// Change Types
export type UserEmail = string

export type OntologyChangeAction = 'create' | 'update' // TODO: | 'delete'

export type FieldChangeData<T> = {
	old?: T
	value: T
}

export type OntologyChangeDataFields = {
	level?: FieldChangeData<string>
	gloss?: FieldChangeData<string>
	brief_gloss?: FieldChangeData<string>
	categories?: FieldChangeData<string[]>
	curated_examples?: FieldChangeData<string>
}

export type WorkflowInfo = {
	email: UserEmail
	date: Date
}

export type OntologyChange = {
	id: number
	concept: ConceptKey
	data: OntologyChangeDataFields
	action: OntologyChangeAction
	approved_by: WorkflowInfo | null
	applied_date: Date | null
	version: string | null
}
