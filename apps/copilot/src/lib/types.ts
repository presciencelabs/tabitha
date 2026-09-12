import type { VerseReference, SourceSimpleJsonEntity } from '@tabitha/types'
import type { CopilotTriggerData, CopilotNote } from '@tabitha/types/copilot'

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

export type TriggerIdData = {
	name: string
	node_id: string
}

export type TriggerDataForLlm = CopilotTriggerData & {
	prompt?: string
}

export type CopilotLlmInput = {
	verse: string
	output_language: string
	prose_level: MttLevel
	tbta_encoding: string
	english_text: string
	lwc_text?: string
	triggers: TriggerDataForLlm[]
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

export type FlagWeightingMap = Record<string, Record<string, number>>

//===============
// encoding parsing and flag extraction

export type IndexStack = number[]

export type CopilotEncodingEntity = Omit<SourceSimpleJsonEntity, 'children' | 'target'> & {
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

//===============
// Brief types

export type BriefSettings = CopilotSettings & {
	rigor: BriefRigorMode
	output_format: BriefOutputFormat
	output_style: BriefOutputStyle
}

export type BriefRigorMode = 'HIGH' | 'LOW'
export type BriefOutputFormat = 'usfm' // TODO | 'docx' | 'pdf'
export type BriefOutputStyle = 'production' // TODO | 'verbose'

export type BriefInput = {
	verse: VerseReference
	lwc: string
	rigor: BriefRigorMode
	output_format: BriefOutputFormat
	output_style: BriefOutputStyle
	lwc_text: string
	notes: CopilotNote[]
}

export type BriefOutput = BriefTabithaOutput & BriefTnnBasedOutput & {
	verse: VerseReference
	lwc: string
	rigor: BriefRigorMode
	tnnPromptVersion: string
	outputStyle: BriefOutputStyle
}

export type BriefTabithaOutput = {
	// TODO rename all the 'sectionX' properties to more meaningful names
	section1: {
		// Provenance flags
		flagNotes: CopilotNote[]
	}
	section2: {
		// LWC verse
		lwcText: string
		englishText?: string
	}
	section3: {
		// Main copilot notes
		notes: {
			name: string	// trigger name
			lwcSpan: string	// relevant text quoted from lwc text
			text: string	// note text (meaning + check)
		}[]
	}
}

export type BriefTnnBasedOutput = {
	section4: {
		// SIL Translator Notes
		sourcePointabilityRows: {
			note: string
			tnnSource: string
			function: 'MECHANICS' | 'CULTURAL' | 'BACKGROUND'
			verseTerm: string | null
			lwcSpan: string | null
			verdict: {
				type: 'RETAIN' | 'SECTION 5' | 'CUT' | 'NOT APPLICABLE' | 'SOLVED'
				subtype: null | 'CULTURAL' | 'BACKGROUND' | 'OUT OF SCOPE' | 'NULL PAYLOAD'
				pointer: string | null
				reason: string | null
			}
		}[]
		notes: { text: string }[]
		excluded: {
			note: string
			reason: string
		}[]
	}
	section5: {
		// Cultural context summary
		cultural: {
			term: string
			summary: string
		}[]
		background: {
			term: string
			summary: string
		}[]
	}
	section6: {
		// Image keywords
		keywords: string[]
	}
	section7: {
		// Consultant note candidates
		decisions: {
			status: 'RESOLVED UPSTREAM' | 'CONFLICT' | 'UNRESOLVED'
			text: string
		}[]
		resolvedUpstream: {
			label: string
			reason: string
		}[]
	}
}

// Backs the disabled convert_to_docx in brief.ts -- see the comment there.
// type BriefDocxTemplateData = {
// 	verseReference: VerseReference
// 	passageReference: string
// 	promptVersion: string
// 	pagePreamble: string
// 	rigorMode: BriefRigorMode
// 	lwcName: string
// 	flagsHeading: string
// 	flagNotes: {
// 		title: string	// flag name
// 		weight: string	// flag weight in circle format eg. '●●●○○'
// 		trace: string	// eg. 'node 1.3.2  ·  Verb  ·  concept: take-B  ·  value: Gnomic
// 		lwcText: string	// the note in the LWC
// 		btText: string		// the note back-translated into English
// 	}[]
// 	sourceHeading: string
// 	sourceBody: string
// 	notesHeading: string
// 	notes: {
// 		ordinal: number	// the number of the note (really needed?)
// 		name: string	// trigger name
// 		text: string	// note text (meaning + check)
// 	}[]
// 	tnnHeading: string
// 	tnnTraces: {
// 		note: string
// 		function: string
// 		lwcSpan1: string
// 		lwcSpan2: string
// 		verdict1: string
// 		verdict2: string
// 		verdict3: string
// 	}[]
// 	retainedNone: boolean
// 	retainedNoneText: string
// 	retainedNotes: { text: string }[]
// 	excludedNotes: { text: string }[]
// 	contextHeading: string
// 	contextNotesCulturalHeading: string
// 	contextNotesCultural: { title: string, text: string }[]
// 	contextNotesBackgroundHeading: string
// 	contextNotesBackground: { title: string, text: string }[]
// 	imagesHeading: string
// 	imageNotes: { title: string }[]
// 	consultantHeading: string
// 	consultantNotes: { text: string }[]
// }
