/// <reference types="svelte" />
import type { Auth, User } from '@auth/sveltekit'
import type { D1Database } from '@cloudflare/workers-types'
import type {
	Concept as ConceptType,
	ConceptKey as ConceptKeyType,
	ConceptSearchFilter as ConceptSearchFilterType,
	CuratedExample as CuratedExampleType,
	Example as ExampleType,
	Reference as ReferenceType,
	SimplificationHint as SimplificationHintType,
	SimplifiedEncodingEntity as SimplifiedEncodingEntityType,
	SimplifiedSemanticEncoding as SimplifiedSemanticEncodingType,
	OntologyChange as OntologyChangeType,
	ContextArgumentName as ContextArgumentNameType,
	ContextArguments as ContextArgumentsType,
	SourceStatus as SourceStatusType,
} from '$lib/types'

declare global {
	type Concept = ConceptType
	type ConceptKey = ConceptKeyType
	type ConceptSearchFilter = ConceptSearchFilterType
	type CuratedExample = CuratedExampleType
	type Example = ExampleType
	type Reference = ReferenceType
	type SimplificationHint = SimplificationHintType
	type SimplifiedEncodingEntity = SimplifiedEncodingEntityType
	type SimplifiedSemanticEncoding = SimplifiedSemanticEncodingType
	type OntologyChange = OntologyChangeType
	type ContextArgumentName = ContextArgumentNameType
	type ContextArguments = ContextArgumentsType
	type SourceStatus = SourceStatusType

	namespace App {
		// interface Error {}
		interface Locals {
			db_ontology: D1Database
			db_auth: D1Database
			auth: Auth
			user: User | undefined
		}
		// interface PageData {}

		interface Platform {
			env: Env
		}
	}
}
