import { pipe } from '$lib/pipeline'
import { phrasify } from '$lib/parser/phrasify'
import { entityfy } from './entityfy'
import { populate_noun_list, replace_punctuation } from './other_rules'

export function analyze(sentences: Sentence[]): SimpleSourceData {
	return pipe(
		replace_punctuation,
		phrasify,
		// replace GAP tokens
		// other movement rules,
		entityfy,
		to_source_data,
		// ordering_rules,
	)(sentences)
}

function to_source_data(source_entities: SimpleSourceEntity[]): SimpleSourceData {
	return {
		source_entities,
		noun_list: populate_noun_list(source_entities),
		notes: [],
	}
}