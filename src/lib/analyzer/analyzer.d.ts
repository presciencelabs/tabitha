type SimpleSourceEntity = {
	category: CategoryName
	value: string
	features: EntityFeature[]
	noun_list_index: string|null
	concept: SourceConcept|null
	pairing_concept: SourceConcept|null
	pairing_type: PairingType
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

type NounListIndex = string
type NounListEntry = {
	index: NounListIndex
	noun: string
}

type AnalysisNote = string

type SimpleSourceData = {
	notes: AnalysisNote[]
	source_entities: SimpleSourceEntity[]
	noun_list: NounListEntry[]
}