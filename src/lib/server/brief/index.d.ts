
type BriefSettings = CopilotSettings & {
	rigor: BriefRigorMode
	output_format: BriefOutputFormat
	output_style: BriefOutputStyle
}

type BriefRigorMode = 'HIGH' | 'LOW'
type BriefOutputFormat = 'usfm' // TODO | 'docx' | 'pdf'
type BriefOutputStyle = 'production' // TODO | 'verbose'

type BriefInput = {
	verse: VerseReference
	lwc: string
	rigor: BriefRigorMode
	output_format: BriefOutputFormat
	output_style: BriefOutputStyle
	lwc_text: string
	notes: CopilotNote[]
}

type BriefOutput = BriefTabithaOutput & BriefTnnBasedOutput & {
	verse: VerseReference
	lwc: string
	rigor: BriefRigorMode
	tnnPromptVersion: string
	outputStyle: BriefOutputStyle
}

type BriefTabithaOutput = {
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

type BriefTnnBasedOutput = {
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

type BriefDocxTemplateData = {
	verseReference: VerseReference
	passageReference: string
	promptVersion: string
	pagePreamble: string
	rigorMode: BriefRigorMode
	lwcName: string
	flagsHeading: string
	flagNotes: {
		title: string	// flag name
		weight: string	// flag weight in circle format eg. '●●●○○'
		trace: string	// eg. 'node 1.3.2  ·  Verb  ·  concept: take-B  ·  value: Gnomic
		lwcText: string	// the note in the LWC
		btText: string		// the note back-translated into English
	}[]
	sourceHeading: string
	sourceBody: string
	notesHeading: string
	notes: {
		ordinal: number	// the number of the note (really needed?)
		name: string	// trigger name
		text: string	// note text (meaning + check)
	}[]
	tnnHeading: string
	tnnTraces: {
		note: string
		function: string
		lwcSpan1: string
		lwcSpan2: string
		verdict1: string
		verdict2: string
		verdict3: string
	}[]
	retainedNone: boolean
	retainedNoneText: string
	retainedNotes: { text: string }[]
	excludedNotes: { text: string }[]
	contextHeading: string
	contextNotesCulturalHeading: string
	contextNotesCultural: { title: string, text: string }[]
	contextNotesBackgroundHeading: string
	contextNotesBackground: { title: string, text: string }[]
	imagesHeading: string
	imageNotes: { title: string }[]
	consultantHeading: string
	consultantNotes: { text: string }[]
}