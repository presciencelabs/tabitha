import type { D1Database } from '@cloudflare/workers-types'
import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'
import { WORD_ENTITY_CATEGORIES } from './lookups'

export async function get_source_features(db: D1Database): Promise<DbFeature[]> {
	const sql = 'SELECT * FROM Features'
	const { results } = await db.prepare(sql).all<DbFeature>()
	return results
}

export async function load_source_feature_map(db: D1Database): Promise<FeatureMap> {
	const sql = 'SELECT * FROM Features'
	const { results } = await db.prepare(sql).all<DbFeature>()

	const grouped_by_category = Map.groupBy(results, ({ category }) => category)
	const feature_map_entries = [...grouped_by_category.entries().map(by_feature_name)]
	return new Map(feature_map_entries)
}

export async function load_target_feature_map(project: string): Promise<FeatureMap|undefined> {
	if (!project.length) {
		return undefined
	}
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/${project}/lookup/features`)
	if (!response.ok) {
		console.error(`Failed to load target features for project ${project}: ${response.status} ${response.statusText}`)
		return undefined
	}
	const results = await response.json() as TargetApiFeatureResult

	const combined_results = [
		...results.source,
		// Lexical features have their own position indexing, and we want to make sure they are appended to the source ones.
		// We sort by position rather than using the exact value, so we just need to offset the lexical positions
		...results.lexical.map(f => ({ ...f, position: f.position + 100 })),
	]

	const grouped_by_category = Map.groupBy(combined_results, ({ category }) => category)
	const feature_map_entries = [...grouped_by_category.entries().map(by_feature_name)]
	return new Map(feature_map_entries)
}

function by_feature_name(category_entry: [CategoryName, DbFeature[]]): [CategoryName, FeatureInfo[]] {
	const [category, features] = category_entry
	const infos = [...Map.groupBy(features, ({ feature }) => feature).entries()]
		.toSorted(([, db_features]) => db_features[0].position)
		.map(([name, db_features]) => ({ name, values: db_features }))
	return [category, infos]
}

export function decode_features(raw_feature_codes: string, category: CategoryName, all_features: FeatureMap): SourceFeatures {
	if (!raw_feature_codes.length) {
		return { feature_codes: '', features: [], noun_list_index: null }
	}

	const is_noun = category === 'Noun'

	// The first feature is the semantic complexity level, which is set during generation.
	// It is therefore meaningless at this stage and can be dropped.
	// The second feature is the lexical sense, which is treated specially elsewhere.
	// So it too can be dropped from the features.
	const feature_codes = WORD_ENTITY_CATEGORIES.has(category) ? raw_feature_codes.slice(is_noun ? 3 : 2) : raw_feature_codes

	// The third feature on a Noun is the Noun List Index, and its value is just the character itself.
	// This feature is not included in the 'Features' database, and so needs to be handled separately.
	const noun_list_index = is_noun ? raw_feature_codes[2] : null

	const features = feature_codes_to_structure(category, feature_codes, all_features)

	return {
		feature_codes,
		features,
		noun_list_index,
	}
}

function encode_features(entity: SourceEntity): string {
	// Encode the entity's features into the TBTA-compatible format
	if (entity.concept) {
		// The '1' is supposed to represent the complexity level, but is set at generation time. So it is always 1 in the encoding.
		return `1${entity.concept.sense}${entity.noun_list_index || ''}${entity.feature_codes}`
	}
	return entity.feature_codes
}

function feature_codes_to_structure(category: CategoryName, feature_codes: string, all_features: FeatureMap): EntityFeature[] {
	const category_features = all_features.get(category) || []
	const feature_code_array = [...feature_codes]

	return category_features.map((feature_info, index) => {
		const code = feature_code_array[index]
		const value_info = feature_info.values.find(v => v.code === code)
		if (!value_info) {
			console.error(`Unknown '${category}' feature code '${code}' of '${feature_info.name}'`)
		}
		const value = value_info?.value || ''
		return { name: feature_info.name, value }
	})
}

function feature_structure_to_codes(category: CategoryName, features: EntityFeature[], all_features: FeatureMap): string {
	const category_features = all_features.get(category) || []
	
	const codes = category_features.map(feature_info => {
		const value = features.find(f => f.name.toLowerCase() === feature_info.name.toLowerCase())?.value.toLowerCase()
		const value_info = feature_info.values.find(v => v.value.toLowerCase() === value)
		if (value && !value_info) {
			console.error(`Unknown '${category}' feature value '${value}' of '${feature_info.name}'`)
		}
		
		// As a default, first try '.' if it exists as a code, otherwise use the first value
		return value_info?.code || feature_info.values.find(f => f.code === '.')?.code || feature_info.values[0].code
	})
	return codes.join('')
}

export async function transform_features_to_codes(db: D1Database, source_entities: SourceEntity[]): Promise<SourceEntity[]> {
	const all_features = await load_source_feature_map(db)

	return source_entities.map(entity => {
		const { category, features } = entity
		const feature_codes = feature_structure_to_codes(category, features, all_features)
		// fill in any missing features in the structure
		const new_features = feature_codes_to_structure(category, feature_codes, all_features)
		return { ...entity, feature_codes, features: new_features }
	})
}