type LanguageProfile = {
	rhetorical_questions: boolean
	clusivity: boolean
	passive: boolean
	dual: boolean
	trial: boolean
	honorifics: boolean
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

type MttLevel = 'grade 5' | 'high-school' | 'BA'

type CopilotSettings = {
	language_profile: LanguageProfile
	lwc?: string
	mtt_level: MttLevel
	max_suggestions: number
}

type CopilotApiResult = {
	english_text: string
	lwc_text?: string
	suggestions: string[]
}