import type {
	ConceptKey,
	OntologyChangeAction,
	UserEmail,
} from '$lib/types'

export type Permission = 'PROTECTED_ACCESS' | 'ADD_CONCEPT' | 'UPDATE_CONCEPT' | 'DELETE_CONCEPT'

export type ConceptUpdateData = ConceptKey & {
	level: string
	gloss: string
	brief_gloss: string
	categories: string[]
	curated_examples: string
}

export type ConceptCreateData = ConceptUpdateData

export type DbOntologyChange = {
	id: number
	concept_stem: string
	concept_sense: string
	concept_part_of_speech: string
	data: string
	action: OntologyChangeAction
	approved_by_email: UserEmail | null
	approved_date: string | null
	applied_date: string | null
	version: string | null
}

export type ConceptQueryBuilder = {
	add_filter: (filter: string, params: (string | number)[]) => ConceptQueryBuilder
	order_by: (column: string) => ConceptQueryBuilder
	prepare: () => import('@cloudflare/workers-types').D1PreparedStatement
}
