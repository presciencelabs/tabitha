
type CopilotSettings = {
	language_profile: LanguageProfile
	lwc: string
	mtt_level: MttLevel
	sensitivity: number
	show_note_sources: boolean
	show_english: boolean
}

type LanguageProfile = {
	// rhetorical_questions: boolean
	clusivity: boolean
	passive: boolean
	dual: boolean
	trial: boolean
	honorifics: boolean
	// indirect_speech: boolean
	closing_quotation_frame: boolean
}

type Reference = {
	book: string
	chapter: number
	verse: number
}

type FeatureName = string
type FeatureValue = string
type EntityFeatures = Record<FeatureName, FeatureValue>

type EncodingEntity = {
	category: string
	concept?: string
	pairing_concept?: string
	features?: EntityFeatures
	children?: EncodingEntity[]
	node_id?: string
}

type FlagExtractionRule = {
	flag: string
	rules: FlagExtractionLayer[]
}

type FlagExtractionLayer = {
	value: string | ((match: EntityMatch) => string | undefined) | undefined
	pattern: PatternEntity
	anchor_extra?: (match: EntityMatch) => Record<string, string>
	comment?: string
}

type PatternEntity = EncodingEntity & {
	name?: string
	optional?: boolean
	category?: string
	children?: PatternEntity[]
}

type SourceApiResult = {
	encoding: EncodingEntity[]
	glosses: Record<string, string>
}

type TargetApiResult = {
	text: string
	audience: string
}

type MttLevel = 'grade5' | 'high_school' | 'undergraduate'

type CopilotLlmInput = {
	verse: string
	output_language: string
	prose_level: MttLevel
	tbta_encoding: string
	english_text: string
	lwc_text?: string
	triggers: TriggerData[]
}

type CopilotLlmCaution = {
	note: string
	source: string
}

type CopilotLlmOutput = {
	cautions: CopilotLlmCaution[]
	lwc_text?: string
}

type CopilotApiResult = CopilotLlmOutput & {
	english_text: string
	verse: Reference
	error?: string
}

type EncodingAnchor = {
	[key: string]: string
	node_id: string
}

type CopilotTriggerFlag = {
	name: string
	value: string
	encoding_anchor: EncodingAnchor
}

type CopilotWeightedFlag = CopilotTriggerFlag & {
	weight: number
}

type IndexStack = number[]

type EntityMatchCapture = {
	node: EncodingEntity
	indexStack: IndexStack
}

type EntityMatch = {
	success: boolean
	bindings: Record<string, any>
	captures: Record<string, EntityMatchCapture>
}

type EntityMatchResult = EntityMatch & {
	flag: string
	rule: FlagExtractionLayer
}