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
	example?: string
}

type EntityFeature = {
	name: FeatureName,
	value: FeatureValue,
}

type TargetApiFeature = DbFeature
type TargetApiFeatureResult = {
	source: TargetApiFeature[]
	lexical: TargetApiFeature[]
}

type FeatureValueInfo = { value: FeatureValue, code: string }
type FeatureInfo = { name: FeatureName, values: FeatureValueInfo[] }
type FeatureMap = Map<CategoryName, FeatureInfo[]>

type ApiFeature = DbFeature

type OntologyResult = {
	stem: string
	sense: string
	part_of_speech: string
	level: string
	gloss: string
	categories: string[]
}

type TargetEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	concept: SourceConcept|null
	target: string
} & SourceFeatures

// This is a combination of SourceEntity and TargetEntity
type EncodingEntity = {
	category: string
	category_abbr: string
	value: string
	concept: SourceConcept|null
	pairing_concept?: SourceConcept|null
	target?: string
} & SourceFeatures

type SimpleEncodingEntity = {
	category: string
	concept?: string
	pairing_concept?: string
	target?: string
	features?: Record<FeatureName, FeatureValue>
	children?: SimpleEncodingEntity[]
}
