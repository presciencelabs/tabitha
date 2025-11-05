type ConceptKey = {
	stem: string
	sense: string
	part_of_speech: string
}

type DbRowConcept = ConceptKey & {
	id: string
	level: string
	categorization: string
	examples: string
	curated_examples: string
	gloss: string
	brief_gloss: string
	occurrences: string
}

type SimplificationHint = ConceptKey & {
	structure: string
	pairing: string
	explication: string
	ontology_status: string
}

interface Concept extends DbRowConcept {
	categories: string[]
	curated_examples: CuratedExample[]
	occurrences: number
	status: OntologyStatus
	how_to_hints: SimplificationHint[]
}

type OntologyStatus = 'present' | 'pending' | 'absent' | 'function_word'

type ConceptSearchFilter = {
	q: string
	scope: 'stems' | 'glosses' | 'all' | 'english'
	category: string
}

type CuratedExample = {
	reference: Reference
	encoding: SimplifiedSemanticEncoding
	sentence: string
}

type DbRowExample = {
	ref_type: string
	ref_id_primary: string
	ref_id_secondary: string
	ref_id_tertiary: string
	context_json: string
}

type Example = {
	reference: Reference
	context: ContextArguments
}

type ContextArgumentName = string
type ContextArgumentValue = string
type ContextArguments = Record<ContextArgumentName, ContextArgumentValue>

type Reference = {
	type: string
	id_primary: string
	id_secondary: string
	id_tertiary: string
}

type SimplifiedEncodingPhrase = {
	part_of_speech: string
	role: string
	word: string
}

type SimplifiedSemanticEncoding =  SimplifiedEncodingPhrase[]
