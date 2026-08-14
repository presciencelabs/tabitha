type AnalyzerStatus = 'ok' | 'warning' | 'error'

type AnalysisResult = {
	// status: AnalyzerStatus
	// notes: AnalysisNote[]
	source_entities: PageSourceEntity[]
	noun_list: NounListEntry[]
}

// Editor Analyzer API

type AnalyzerApiResponse = {
	// notes: AnalysisNote[]
	source_entities: AnalyzerApiSourceEntity[]
	noun_list: NounListEntry[]
}

type AnalyzerApiSourceEntity = {
	category: CategoryName
	value: string
	features: EntityFeature[]
	noun_list_index: string|null
	concept: SourceConcept|null
	pairing_concept: SourceConcept|null
	pairing_type: PairingType
}
