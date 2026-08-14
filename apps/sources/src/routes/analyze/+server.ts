import { PUBLIC_EDITOR_API_HOST } from '$env/static/public'
import { CATEGORY_ABBREVIATIONS } from '$lib/encoding/lookups'
import { structure_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { transform_features_to_codes } from '$lib/encoding/features'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals: { db }, url: { searchParams } }) => {
	const text = searchParams.get('text') ?? ''

	const response = await fetch(`${PUBLIC_EDITOR_API_HOST}/analyze?text=${sanitize_input(text)}`)
	const api_result: AnalyzerApiResponse = await response.json()

	const source_entities = api_result.source_entities.map(transform_api_entity)
	const source_entities_with_features = await transform_features_to_codes(db, source_entities)
	const structured_entities = structure_semantic_encoding(source_entities_with_features)

	const result: AnalysisResult = {
		source_entities: structured_entities,
		noun_list: api_result.noun_list,
	}
	return json(result)
}

function transform_api_entity(api_entity: AnalyzerApiSourceEntity): SourceEntity {
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

function sanitize_input(text: string): string {
	return text.replaceAll('\n', ' ')
}
