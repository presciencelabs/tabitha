type LanguageProfile = {
	rhetorical_questions: boolean
	clusivity: boolean
	passive: boolean
	dual: boolean
	trial: boolean
	honorifics: boolean
	indirect_speech: boolean
}

type Reference = {
	book: string
	chapter: number
	verse: number
}

type EntityFeatures = Record<string, string>

type EncodingEntity = {
	category: string
	concept?: string
	pairing_concept?: string
	features?: Record<string, string>
	children?: EncodingEntity[]
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

type CopilotSettings = {
	language_profile: LanguageProfile
	lwc: string
	mtt_level: MttLevel
	max_cautions: number
}

type CopilotLlmInput = {
	output_language: string
	prose_level: MttLevel
	tbta_encoding: string
	english_text: string
	issues: string[]
	max_cautions: number
}

type CopilotLlmOutput = {
	cautions: string[]
	translated_text?: string
}

type CopilotApiResult = CopilotLlmOutput & {
	english_text: string
	verse: Reference
}