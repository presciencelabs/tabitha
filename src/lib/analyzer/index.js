import { pipe } from '$lib/pipeline'
import { phrasify } from '$lib/parser/phrasify'
import { entityfy } from './entityfy'
import { populate_noun_list, replace_punctuation } from './other_rules'

/**
 * 
 * @param {Sentence[]} sentences 
 * @return {SimpleSourceData[]}
 */
export function analyze(sentences) {
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

/**
 * 
 * @param {SimpleSourceEntity[]} source_entities 
 * @returns {SimpleSourceData}
 */
function to_source_data(source_entities) {
	return {
		source_entities,
		noun_list: populate_noun_list(source_entities),
		notes: [],
	}
}