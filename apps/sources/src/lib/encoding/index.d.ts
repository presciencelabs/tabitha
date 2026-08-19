import type {
	CategoryName as _CategoryName,
	FeatureName as _FeatureName,
	FeatureValue as _FeatureValue,
	EntityFeature as _EntityFeature,
	OntologyResult as _OntologyResult,
	SourceConcept as _SourceConcept,
	SourceFeatures as _SourceFeatures,
	SourceConceptData as _SourceConceptData,
	SourceEntity as _SourceEntity,
	TargetEntity as _TargetEntity,
	EncodingEntity as _EncodingEntity,
	SimpleEncodingEntity as _SimpleEncodingEntity,
	NounListEntry as _NounListEntry,
	PageSourceEntity as _PageSourceEntity,
	DbFeature as _DbFeature,
	ApiFeature as _ApiFeature,
	FeatureValueInfo as _FeatureValueInfo,
	FeatureInfo as _FeatureInfo,
	FeatureMap as _FeatureMap,
	TargetApiFeatureResult as _TargetApiFeatureResult,
	SourceStatus as _SourceStatus,
} from '@tabitha/types'

declare global {
	type CategoryName = _CategoryName
	type FeatureName = _FeatureName
	type FeatureValue = _FeatureValue
	type EntityFeature = _EntityFeature
	type OntologyResult = _OntologyResult
	type SourceConcept = _SourceConcept
	type SourceFeatures = _SourceFeatures
	type SourceConceptData = _SourceConceptData
	type SourceEntity = _SourceEntity
	type TargetEntity = _TargetEntity
	type EncodingEntity = _EncodingEntity
	type SimpleEncodingEntity = _SimpleEncodingEntity
	type NounListEntry = _NounListEntry
	type PageSourceEntity = _PageSourceEntity
	type DbFeature = _DbFeature
	type ApiFeature = _ApiFeature
	type FeatureValueInfo = _FeatureValueInfo
	type FeatureInfo = _FeatureInfo
	type FeatureMap = _FeatureMap
	type TargetApiFeature = _DbFeature
	type TargetApiFeatureResult = _TargetApiFeatureResult
	type SourceStatus = _SourceStatus
	type EntityFilter = (entity: SourceEntity) => boolean
}

export {}
