import type { CategoryName, FeatureName, FeatureValue } from '@tabitha/types'
import type { TokenRuleJsonBase, TokenRule } from '$lib/rules/types'

export type FeatureRuleJson = TokenRuleJsonBase | TokenRuleJsonBase[]
export type FeatureValueRules = [FeatureValue, TokenRule[]]
export type FeatureRules = [FeatureName, FeatureValueRules[]]
export type FeatureRulesByCategory = Record<CategoryName, FeatureRules[]>

export type FeatureValueRulesJson = [FeatureValue, FeatureRuleJson]
export type FeatureRulesJson = [FeatureName, FeatureValueRulesJson[]]
export type FeatureRulesByCategoryJson = Record<CategoryName, FeatureRulesJson[]>
