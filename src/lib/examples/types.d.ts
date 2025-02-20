type ContextArgumentMap = Map<Concept['part_of_speech'], ContextArgumentName[]>

type Option = ContextArgumentValue
type Options = Set<Option>
type FilterMap = Map<ContextArgumentName, Options>
type FilterRulesMap = Map<Concept['part_of_speech'], FilterMap>

type TargetTextResult = {
	text: string
	audience: string
}

type SourceData = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
	phase_1_encoding: string
	semantic_encoding: string
	parsed_semantic_encoding: SourceEntity[]
	notes: string
}

type SourceEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	feature_codes: string
	features: EntityFeature[]
	concept: SourceConcept|null
	pairing_concept: SourceConcept|null
}

type SourceConcept = {
	stem: string
	sense: string
	part_of_speech: string
}

type CategoryName = string
type FeatureName = string
type FeatureValue = string

type EntityFeature = {
	name: FeatureName,
	value: FeatureValue,
}