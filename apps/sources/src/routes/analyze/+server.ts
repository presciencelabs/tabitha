import { PUBLIC_EDITOR_API_HOST } from '$env/static/public'
import { create_editor_client } from '@tabitha/api-client'
import { CATEGORY_ABBREVIATIONS } from '$lib/encoding/lookups'
import { structure_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { transform_features_to_codes } from '$lib/encoding/features'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { SimpleSourceEntity, SourceEntity } from '@tabitha/types'
import type { AnalysisResult } from '$lib/types'

const editor_client = create_editor_client({ base_url: PUBLIC_EDITOR_API_HOST })

export async function GET({ locals: { db }, url: { searchParams } }: Parameters<RequestHandler>[0]) {
	const text = searchParams.get('text') ?? ''

	const api_result = await editor_client.analyze_text(sanitize_input(text))
	if (!api_result) {
		throw new Error('Analyze API request failed')
	}

	const source_entities = api_result.source_entities.map(transform_api_entity)
	const source_entities_with_features = await transform_features_to_codes({ db, source_entities })
	const structured_entities = structure_semantic_encoding(source_entities_with_features)

	const result: AnalysisResult = {
		source_entities: structured_entities,
		noun_list: api_result.noun_list,
	}
	return json(result)
}

function transform_api_entity(api_entity: SimpleSourceEntity): SourceEntity {
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
