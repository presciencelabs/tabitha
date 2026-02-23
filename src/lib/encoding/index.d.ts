type SourceEntity = {
	category: CategoryName
	category_abbr: string
	value: string
} & SourceFeatures & SourceConceptData

type SourceFeatures = {
	feature_codes: string
	features: EntityFeature[]
	noun_list_index: string|null
}

type SourceConceptData = {
	concept: SourceConcept|null
	pairing_concept: SourceConcept|null
	pairing_type: string
}

type SourceConcept = {
	stem: string
	sense: string
	part_of_speech: string
	ontology_data?: OntologyResult
}

type EntityFilter = (entity: SourceEntity) => boolean

type CategoryName = string
type FeatureName = string
type FeatureValue = string

type DbFeature = {
	category: CategoryName
	position: number
	code: string
	feature: FeatureName
	value: FeatureValue
}

type EntityFeature = {
	name: FeatureName,
	value: FeatureValue,
}

type OntologyResult = {
	stem: string
	sense: string
	part_of_speech: string
	level: string
	gloss: string
	categories: string[]
}
