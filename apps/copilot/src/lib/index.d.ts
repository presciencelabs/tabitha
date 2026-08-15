import type {
	CopilotMode as _CopilotMode,
	MttLevel as _MttLevel,
	ProfileCustomCombination as _ProfileCustomCombination,
	LanguageProfile as _LanguageProfile,
	CopilotNoteSettings as _CopilotNoteSettings,
	CopilotDisplaySettings as _CopilotDisplaySettings,
	CopilotSettings as _CopilotSettings,
	EncodingAnchor as _EncodingAnchor,
	CopilotTriggerFlag as _CopilotTriggerFlag,
	CopilotWeightedFlag as _CopilotWeightedFlag,
	TriggerIdData as _TriggerIdData,
	TriggerData as _TriggerData,
	CopilotLlmInput as _CopilotLlmInput,
	CopilotLlmNote as _CopilotLlmNote,
	CopilotLlmOutput as _CopilotLlmOutput,
	CopilotNote as _CopilotNote,
	CopilotApiResult as _CopilotApiResult,
	IndexStack as _IndexStack,
	CopilotEncodingEntity as _CopilotEncodingEntity,
	EntityMatchCapture as _EntityMatchCapture,
	EntityMatch as _EntityMatch,
	FlagExtractionLayer as _FlagExtractionLayer,
	FlagExtractionRule as _FlagExtractionRule,
	PatternEntity as _PatternEntity,
	EntityMatchResult as _EntityMatchResult,
	ChapterReference as _ChapterReference,
	VerseReference as _VerseReference,
	FeatureName as _FeatureName,
	FeatureValue as _FeatureValue,
} from '@tabitha/types'

declare global {
	type CopilotMode = _CopilotMode
	type MttLevel = _MttLevel
	type ProfileCustomCombination = _ProfileCustomCombination
	type LanguageProfile = _LanguageProfile
	type CopilotNoteSettings = _CopilotNoteSettings
	type CopilotDisplaySettings = _CopilotDisplaySettings
	type CopilotSettings = _CopilotSettings
	type EncodingAnchor = _EncodingAnchor
	type CopilotTriggerFlag = _CopilotTriggerFlag
	type CopilotWeightedFlag = _CopilotWeightedFlag
	type TriggerIdData = _TriggerIdData
	type TriggerData = _TriggerData
	type CopilotLlmInput = _CopilotLlmInput
	type CopilotLlmNote = _CopilotLlmNote
	type CopilotLlmOutput = _CopilotLlmOutput
	type CopilotNote = _CopilotNote
	type CopilotApiResult = _CopilotApiResult
	type IndexStack = _IndexStack
	type EncodingEntity = _CopilotEncodingEntity
	type EntityMatchCapture = _EntityMatchCapture
	type EntityMatch = _EntityMatch
	type FlagExtractionLayer = _FlagExtractionLayer
	type FlagExtractionRule = _FlagExtractionRule
	type PatternEntity = _PatternEntity
	type EntityMatchResult = _EntityMatchResult
	type ChapterReference = _ChapterReference
	type VerseReference = _VerseReference
	type FeatureName = _FeatureName
	type FeatureValue = _FeatureValue
	type EntityFeatures = Record<FeatureName, FeatureValue>

	type SourceApiResult = {
		encoding: EncodingEntity[]
		glosses: Record<string, string>
	}

	type TargetApiResult = {
		text: string
		audience: string
		ideal?: string
	}
}

export {}