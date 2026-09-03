import type { CategoryName, FeatureName, FeatureValue, NounListEntry, Reference, SourceEntity, SourceStatus } from '@tabitha/types'

export type SourceType = {
	type: string
}

export type ViewSettings = {
	show_hover_popups: boolean
}

export type PrimaryId = {
	id_primary: string
}

export type SecondaryId = {
	id_secondary: string
}

export type TertiaryId = {
	id_tertiary: string
}

export type Source = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
	phase_1_encoding: string
	semantic_encoding: string
	comments: string
	status: SourceStatus
	notes: string
}

export type ApiSource = Source & {
	parsed_semantic_encoding: SourceEntity[]
}

export type NavData = {
	previous: Reference | null
	current: Reference
	next: Reference | null
}

export type PageData = {
	source: PageSource
	nav_data: NavData
}

export type PageSource = Source & {
	parsed_semantic_encoding: PageSourceEntity[]
	noun_list: NounListEntry[]
}

export type PageSourceEntity = SourceEntity & {
	id: number
	parent_id: number
	boundary_category: string
}

export type AnalyzerStatus = 'ok' | 'warning' | 'error'

export type AnalysisResult = {
	// status: AnalyzerStatus
	// notes: AnalysisNote[]
	source_entities: PageSourceEntity[]
	noun_list: NounListEntry[]
}

export type StatusRequestReference = {
	type?: string
	id_primary: string
	id_secondary?: string
}

export type StatusResult = {
	reference: StatusRequestReference
	status: SourceStatus
}

export type DbFeature = {
	category: CategoryName
	position: number
	code: string
	feature: FeatureName
	value: FeatureValue
	example?: string
}

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
