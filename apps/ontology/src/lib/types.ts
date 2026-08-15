export type {
	PartOfSpeech,
	OntologyStatus,
	ConceptKey,
	DbRowConcept,
	SimplificationHint,
	HowToEntry,
	Concept,
	ConceptSearchFilter,
	Reference,
	CategoryName,
	FeatureName,
	FeatureValue,
	SimpleEncodingFeature,
	SimplifiedEncodingEntity,
	SimplifiedSemanticEncoding,
	CuratedExample,
	ContextArgumentName,
	ContextArgumentValue,
	ContextArguments,
	SourceStatus,
	Example,
	TargetTextResult,
	SourceConcept,
	EntityFeature,
	SourceEntity,
	SourceData,
	StatusApiResult,
	Book,
	UserEmail,
	OntologyChangeAction,
	FieldChangeData,
	OntologyChangeDataFields,
	WorkflowInfo,
	OntologyChange,
	LookupTerm,
	LookupWord,
	LookupResult,
	CaseFrame,
} from '@tabitha/types'

export type DbRowExample = {
	ref_type: string
	ref_id_primary: string
	ref_id_secondary: number
	ref_id_tertiary: number
	context_json: string
}

export type ContextArgumentMap = Map<string, string[]>
export type Option = string
export type Options = Set<Option>
export type FilterMap = Map<string, Options>
export type FilterRulesMap = Map<string, FilterMap>
