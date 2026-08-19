import type { PairingType } from '@tabitha/types'
import type { TokenRuleJsonBase, TokenRule } from '$lib/rules/types'

export type SimpleSourceEntity = {
	category: CategoryName
	value: string
	features: EntityFeature[]
	noun_list_index: string | null
	concept: SourceConcept | null
	pairing_concept: SourceConcept | null
	pairing_type: PairingType
}

export type SourceConcept = {
	stem: string
	sense: string
	part_of_speech: string
}

export type CategoryName = string
export type FeatureName = string
export type FeatureValue = string

export type EntityFeature = {
	name: FeatureName
	value: FeatureValue
}

export type NounListIndex = string
export type NounListEntry = {
	index: NounListIndex
	noun: string
}

export type AnalysisNote = string

export type SimpleSourceData = {
	notes: AnalysisNote[]
	source_entities: SimpleSourceEntity[]
	noun_list: NounListEntry[]
}

export type FeatureRuleJson = TokenRuleJsonBase | TokenRuleJsonBase[]
export type FeatureValueRules = [FeatureValue, TokenRule[]]
export type FeatureRules = [FeatureName, FeatureValueRules[]]
export type FeatureRulesByCategory = Record<CategoryName, FeatureRules[]>

export type FeatureValueRulesJson = [FeatureValue, FeatureRuleJson]
export type FeatureRulesJson = [FeatureName, FeatureValueRulesJson[]]
export type FeatureRulesByCategoryJson = Record<CategoryName, FeatureRulesJson[]>
