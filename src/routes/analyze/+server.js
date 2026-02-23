import { PUBLIC_EDITOR_API_HOST } from '$env/static/public'
import { CATEGORY_ABBREVIATIONS } from '$lib/encoding/lookups'
import { structure_semantic_encoding, transform_features_to_codes } from '$lib/encoding/semantic_encoding'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, url: { searchParams } }) {
	/** @type {string} */
	const text = searchParams.get('text') ?? ''

	const response = await fetch(`${PUBLIC_EDITOR_API_HOST}/analyze?text=${sanitize_input(text)}`)
	/** @type {AnalyzerApiResponse} */
	const api_result = await response.json()

	// console.log(api_result.source_entities.map(e => `${e.category} ${e.value} ${e.features.map(f => f.name + '=' + f.value).join('|')}`))

	const source_entities = api_result.source_entities.map(transform_api_entity)
	const source_entities_with_features = await transform_features_to_codes(db, source_entities)
	const structured_entities = structure_semantic_encoding(source_entities_with_features)

	// console.log()
	// console.log(source_entities_with_features.map(e => `${e.category} ${e.value} ${e.features.map(f => f.name + '=' + f.value).join('|')}`))

	/** @type {AnalysisResult} */
	const result = {
		source_entities: structured_entities,
		noun_list: api_result.noun_list,
	}
	return json(result)
}

/**
 * @param {AnalyzerApiSourceEntity} api_entity
 * @returns {SourceEntity}
 */
function transform_api_entity(api_entity) {
	const { category, value, features, concept, pairing_concept, pairing_type, noun_list_index } = api_entity
	return {
		category,
		category_abbr: CATEGORY_ABBREVIATIONS.get(category) || '',
		value,
		features,
		feature_codes: '',
		noun_list_index,
		concept,
		pairing_concept,
		pairing_type: pairing_type === 'complex' ? '/' : '\\',
	}
}

/**
 * @param {string} text
 */
function sanitize_input(text) {
	return text.replaceAll('\n', ' ')
}