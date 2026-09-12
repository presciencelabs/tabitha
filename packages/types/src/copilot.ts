import type { VerseReference } from './reference'

export type CopilotEncodingFlag = {
	name: string
	value: string
	encoding_anchor: {
		[key: string]: string
		node_id: string
	}
	weight: number
}

export type CopilotTriggerData = {
	name: string
	node_id: string
	flags: CopilotEncodingFlag[]
	weight: number
}

export type CopilotNote = {
	meaning: string
	check: string
	quoted_text: string
	trigger: CopilotTriggerData
}

export type CopilotNotesResult = {
	verse: VerseReference
	english_text: string
	lwc_text?: string
	notes: CopilotNote[]
	error?: string
}
