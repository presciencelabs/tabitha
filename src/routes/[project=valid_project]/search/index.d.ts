type SourceReference = {
	type: string
	id_primary: string
	id_secondary: number
	id_tertiary: number
}

type DbTextResult = TextResult & BookResult & ChapterResult & VerseResult

type SearchTextResult = {
	reference: SourceReference
	texts: TextResult[]
}

type FilterMap = Map<string, string[]>