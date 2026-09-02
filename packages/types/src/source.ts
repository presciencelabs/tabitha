import type { SourceStatus } from './reference'
import type { OntologyResult } from './ontology'

export type CategoryName = string
export type FeatureName = string
export type FeatureValue = string

export type EntityFeature = {
	name: FeatureName
	value: FeatureValue
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
	pairing_type: PairingType | null
}

export type PairingType = 'simple-complex' | 'dynamic-literal' | 'metric-biblical'

export type SourceEntity = {
	category: CategoryName
	category_abbr: string
	value: string
} & SourceConceptData & SourceFeatures

export type TargetEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	concept: SourceConcept | null
	target: string
} & SourceFeatures

// Combination of SourceEntity and TargetEntity used in Sources encoding pipeline
export type EncodingEntity = {
	category: CategoryName
	category_abbr: string
	value: string
	concept: SourceConcept | null
	pairing_concept?: SourceConcept | null
	pairing_type?: PairingType | null
	target?: string
} & SourceFeatures

export type SimpleEncodingEntity = {
	category: CategoryName
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

export type SourceApiFeature = {
	category: CategoryName
	position: number
	code: string
	feature: FeatureName
	value: FeatureValue
	example?: string
}
