import type { SourceStatus } from './reference'

export type CategoryName = string
export type FeatureName = string
export type FeatureValue = string

export type EntityFeature = {
	name: FeatureName
	value: FeatureValue
}

export type OntologyResult = {
	stem: string
	sense: string
	part_of_speech: string
	level: string
	gloss: string
	categories: string[]
	status: string
}

export type SourceConcept = {
	stem: string
	sense: string
	part_of_speech: string
	ontology_data?: OntologyResult
}

export type SourceFeatures = {
	feature_codes: string
	features: EntityFeature[]
	noun_list_index: string | null
}

export type SourceConceptData = {
	concept: SourceConcept | null
	pairing_concept: SourceConcept | null
	pairing_type: string
}

export type SourceEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	feature_codes: string
	features: EntityFeature[]
	concept: SourceConcept | null
	pairing_concept: SourceConcept | null
	pairing_type?: string
	noun_list_index: string | null
}

export type TargetEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	concept: SourceConcept | null
	target: string
} & SourceFeatures

// Combination of SourceEntity and TargetEntity used in Sources encoding pipeline
export type EncodingEntity = {
	category: string
	category_abbr: string
	value: string
	concept: SourceConcept | null
	pairing_concept?: SourceConcept | null
	target?: string
	feature_codes: string
	features: EntityFeature[]
	noun_list_index: string | null
}

export type SimpleEncodingEntity = {
	category: string
	concept?: string
	pairing_concept?: string
	target?: string
	features?: Record<FeatureName, FeatureValue>
	children?: SimpleEncodingEntity[]
}

export type NounListEntry = {
	index: string
	noun: string
}

export type PageSourceEntity = SourceEntity & {
	noun_list_index?: string | null
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

export type DbFeature = {
	category: CategoryName
	position: number
	code: string
	feature: FeatureName
	value: FeatureValue
	example?: string
}

export type ApiFeature = DbFeature

export type FeatureValueInfo = {
	value: FeatureValue
	code: string
	example?: string
}

export type FeatureInfo = {
	name: FeatureName
	values: FeatureValueInfo[]
}

export type FeatureMap = Map<CategoryName, FeatureInfo[]>
