import type { Reference, SourceStatus } from './reference'

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
	| 'unknown'

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

export type HowToEntry = {
	structure: string
	pairing: string
	explication: string
}

export type SimpleEncodingFeature = {
	code: string
	value: string
}

export type SimplifiedEncodingEntity = {
	category: string
	word: string | undefined
	feature: SimpleEncodingFeature | undefined
}

export type SimplifiedSemanticEncoding = SimplifiedEncodingEntity[]

export type CuratedExample = {
	reference: Reference
	encoding: SimplifiedSemanticEncoding
	sentence: string
}

export type ContextArgumentName = string
export type ContextArgumentValue = string
export type ContextArguments = Record<ContextArgumentName, ContextArgumentValue>

export type Example = {
	reference: Reference
	context: ContextArguments
	book_status: SourceStatus
}

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

export type LookupTerm = string

export type LookupWord = {
	stem: string
	part_of_speech: string
}
