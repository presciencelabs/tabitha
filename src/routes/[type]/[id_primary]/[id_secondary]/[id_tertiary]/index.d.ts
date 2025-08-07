
type Source = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
	phase_1_encoding: string
	semantic_encoding: string
	comments: string
	notes: string
}

type NavData = {
	previous: Reference | null
	next: Reference | null
}

type PageData = {
	source: Source
	parsed_encoding: SourceEntity[]
	nav_data: NavData
}