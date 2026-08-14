type SourceType = {
	type: string
}

type Reference = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
}

type ViewSettings = {
	show_hover_popups: boolean
}

type SourceStatus = 'Not Started' | 'Initial Analysis in Progress' | 'Initial Analysis Complete' | 'Final Review in Progress' | 'Ready to Translate'