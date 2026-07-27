type CopilotMode = 'discern' | 'brief'

type CopilotSettings = CopilotNoteSettings & CopilotDisplaySettings

type CopilotNoteSettings = {
	language_profile: LanguageProfile
	lwc: string
	mtt_level: MttLevel
	sensitivity: number
	mode: CopilotMode
}

type CopilotDisplaySettings = {
	show_note_sources: boolean
	show_english: boolean
}

type LanguageProfile = {
	multiple_past: boolean
	multiple_future: boolean
	noun_number: string[]
	noun_proximity: string[]
	noun_clusivity: boolean
	as_third_handling: 'third' | 'first_second' | 'apposition'

	passive: 'none' | 'agent_forbidden' | 'agent_allowed' | 'other'
	rhetorical_questions: boolean
	honorifics: boolean
	speech_formula_position: 'before' | 'after' | 'both' | 'either'

	custom_weights: Record<string, Record<string, number>>
	custom_combinations: ProfileCustomCombination[]
}

type ProfileCustomCombination = {
	name: string
	flags: Record<string, string[]>
	weight: number
	prompt: string
}

type ChapterReference = {
	book: string
	chapter: number
}

type VerseReference = {
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

type TriggerIdData = {
	name: string
	node_id: string
}

type TriggerData = TriggerIdData & {
	flags: CopilotWeightedFlag[]
	weight: number
	prompt?: string
}

type CopilotLlmNote = {
	meaning: string
	check: string
	quoted_text: string
	trigger: TriggerIdData
}

type CopilotLlmOutput = {
	notes: CopilotLlmNote[]
	lwc_text?: string
}

type CopilotNote = {
	meaning: string
	check: string
	quoted_text: string
	trigger: TriggerData
}

type CopilotApiResult = {
	verse: VerseReference
	english_text: string
	lwc_text?: string
	notes: CopilotNote[]
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