import type { Reference } from './reference'
import type { ConceptKey, SourceEntityCategory, SourceStatus } from './core'

//===============
// Core types

export type TargetEntityCategory = string
export type EncodingEntityCategory = SourceEntityCategory | TargetEntityCategory

export type PairingType = 'simple-complex' | 'dynamic-literal' | 'metric-biblical'

export type FeatureName = string
export type FeatureValue = string

export type EntityFeature = {
	name: FeatureName
	value: FeatureValue
}

//===============
// partial-reference based APIs

export type SourceType = Pick<Reference, 'type'>
export type PrimaryId = Pick<Reference, 'id_primary'>
export type SecondaryId = Pick<Reference, 'id_secondary'>
export type TertiaryId = Pick<Reference, 'id_tertiary'>

//===============
// main source API

export type SourceFeaturesData = {
	feature_codes: string
	features: EntityFeature[]
	noun_list_index: string | null
}

export type SourceConceptData = {
	concept: ConceptKey | null
	pairing_concept: ConceptKey | null
	pairing_type: PairingType | null
}

export type SourceEntity = {
	category: SourceEntityCategory
	category_abbr: string
	value: string
} & SourceConceptData & SourceFeaturesData

export type SourceResult = Reference & {
	phase_1_encoding: string
	semantic_encoding: string
	parsed_semantic_encoding: SourceEntity[]
	comments: string
	status: SourceStatus
	notes: string
}

//===============
// simple-json API

export type SourceSimpleJsonResult = {
	encoding: SourceSimpleJsonEntity[]
	glosses?: Record<string, string>
}

export type SourceSimpleJsonEntity = {
	category: EncodingEntityCategory
	concept?: string
	pairing_concept?: string
	target?: string
	features?: Record<FeatureName, FeatureValue>
	children?: SourceSimpleJsonEntity[]
}

//===============
// raw-to-json API

// This is used while parsing encoding that is partially-generated in a target language
export type TargetEntity = {
	category: TargetEntityCategory
	category_abbr: string
	value: string
	concept: ConceptKey | null
	target: string
} & SourceFeaturesData

// Combination of SourceEntity and TargetEntity used in Sources encoding pipeline
export type EncodingEntity = {
	category: EncodingEntityCategory
	category_abbr: string
	value: string
	concept: ConceptKey | null
	pairing_concept?: ConceptKey | null
	pairing_type?: PairingType | null
	target?: string
} & SourceFeaturesData

//===============
// analyze API

export type NounList = NounListEntry[]

export type NounListEntry = {
	index: string
	noun: string
}

// TODO actually use this
export type AnalyzerStatus = 'ok' | 'warning' | 'error'

export type AnalysisResult = {
	// status: AnalyzerStatus
	// notes: AnalysisNote[]
	source_entities: SourceEntity[]
	noun_list: NounList
}

//===============
// lookup/features API

export type SourceFeature = {
	category: SourceEntityCategory
	position: number
	code: string
	feature: FeatureName
	value: FeatureValue
	example?: string
}

export type SourceFeatureResult = {
	source: SourceFeature[]
}

//===============
// lookup/status API

// TODO rework this
export type StatusRequestReference = {
	type?: string
	id_primary: string
	id_secondary?: string
}

export type SourceStatusResult = {
	reference: StatusRequestReference
	status: SourceStatus
}

/**
 * A single verse's status, plus whether that verse actually holds a semantic encoding.
 *
 * Separate from `SourceStatusResult` because only a verse can answer the encoding question --
 * a book or chapter rolls many verses up into one status and has no single answer to give.
 *
 * The two fields answer genuinely different questions, because they arrive from different
 * places: `semantic_encoding` comes from the TBTA export, while `status` is loaded afterwards
 * from a separate verse-status CSV that tracks the team's own workflow phases. Neither
 * migration consults the other, so a verse can sit at 'Final Review in Progress' with nothing
 * encoded. Anything deciding whether there is a structure to show should read `has_encoding`;
 * `status` answers how far along the people are, not what the data holds.
 */
export type SourceVerseStatusResult = SourceStatusResult & {
	has_encoding: boolean
}
