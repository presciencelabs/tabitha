export type Reference = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
}

export type ChapterReference = {
	book: string
	chapter: number
}

export type VerseReference = {
	book: string
	chapter: number
	verse: number
}

export type ParsedReference = {
	type: string
	book: string
	chapter: number
	verse: number
	raw?: string
}

export type SourceStatus =
	| 'Not Started'
	| 'Initial Analysis in Progress'
	| 'Initial Analysis Complete'
	| 'Final Review in Progress'
	| 'Ready to Translate'

export type StatusApiResult = {
	status: SourceStatus
}

export type Book = Record<number, string>
