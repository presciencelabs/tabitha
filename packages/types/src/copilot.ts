import type { VerseReference } from './reference'

export type CopilotMode = 'discern' | 'brief'

export type MttLevel = 'grade5' | 'high_school' | 'undergraduate'

export type ProfileCustomCombination = {
	name: string
	flags: Record<string, string[]>
	weight: number
	prompt: string
}

export type LanguageProfile = {
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

export type CopilotNoteSettings = {
	language_profile: LanguageProfile
	lwc: string
	mtt_level: MttLevel
	sensitivity: number
	mode: CopilotMode
}

export type CopilotDisplaySettings = {
	show_note_sources: boolean
	show_english: boolean
}

export type CopilotSettings = CopilotNoteSettings & CopilotDisplaySettings

export type EncodingAnchor = {
	[key: string]: string
	node_id: string
}

export type CopilotTriggerFlag = {
	name: string
	value: string
	encoding_anchor: EncodingAnchor
}

export type CopilotWeightedFlag = CopilotTriggerFlag & {
	weight: number
}

export type TriggerIdData = {
	name: string
	node_id: string
}

export type TriggerData = TriggerIdData & {
	flags: CopilotWeightedFlag[]
	weight: number
	prompt?: string
}

export type CopilotLlmInput = {
	verse: string
	output_language: string
	prose_level: MttLevel
	tbta_encoding: string
	english_text: string
	lwc_text?: string
	triggers: TriggerData[]
}

export type CopilotLlmNote = {
	meaning: string
	check: string
	quoted_text: string
	trigger: TriggerIdData
}

export type CopilotLlmOutput = {
	notes: CopilotLlmNote[]
	lwc_text?: string
}

export type CopilotNote = {
	meaning: string
	check: string
	quoted_text: string
	trigger: TriggerData
}

export type CopilotApiResult = {
	verse: VerseReference
	english_text: string
	lwc_text?: string
	notes: CopilotNote[]
	error?: string
}

export type IndexStack = number[]

export type CopilotEncodingEntity = {
	category: string
	concept?: string
	pairing_concept?: string
	features?: Record<string, string>
	children?: CopilotEncodingEntity[]
	node_id?: string
}

export type EntityMatchCapture = {
	node: CopilotEncodingEntity
	indexStack: IndexStack
}

export type EntityMatch = {
	success: boolean
	bindings: Record<string, unknown>
	captures: Record<string, EntityMatchCapture>
}

export type FlagExtractionLayer = {
	value: string | ((match: EntityMatch) => string | undefined) | undefined
	pattern: PatternEntity
	anchor_extra?: (match: EntityMatch) => Record<string, string>
	comment?: string
}

export type FlagExtractionRule = {
	flag: string
	rules: FlagExtractionLayer[]
}

export type PatternEntity = CopilotEncodingEntity & {
	name?: string
	optional?: boolean
	category?: string
	children?: PatternEntity[]
}

export type EntityMatchResult = EntityMatch & {
	flag: string
	rule: FlagExtractionLayer
}
