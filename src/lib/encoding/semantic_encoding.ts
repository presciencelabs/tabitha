import type { D1Database } from '@cloudflare/workers-types'
import { CATEGORY_ABBREVIATIONS, CATEGORY_NAME_LOOKUP, WORD_ENTITY_CATEGORIES } from './lookups'
import { is_boundary_end, is_boundary_start } from './entity_filters'

/**
 * The phase_2_encoding looks something like:
 * ~\wd ~\tg c-IDp00NNNNNNNNNNNNN.............~\lu {~\wd ~\tg C-1A.....~\lu then~\wd ~\tg n-SAN.N........~\lu (...
 *
 * If present, the first character of the features indicates the 'entity' type.
 * This could be a clause/phrase boundary, part of speech, or even certain punctuation.
 *
 * '{' and '}' indicate a main clause boundary
 * '[' and ']' indicate a subordinate clause boundary
 * '(' and ')' indicate a phrase boundary
 *
 * Examples:
 * ~\wd ~\tg c-IDp00NNNNNNNNNNNNN.............~\lu {    => { type: 'c', label: 'Clause', features: 'IDp00NNNNNNNNNNNNN.............', value: '{' }
 * ~\wd ~\tg N-1A1SDAnK3NN........~\lu God  => { type: 'N', label: 'Noun', features: '1A1SDAnK3NN........', value: 'God' }
 * ~\wd ~\tg v-S.....~\lu (     => { type: 'v', label: 'VP', features: 'S.....', value: '(' }
 * ~\wd ~\tg C-1A.....~\lu then => { type: 'C', label: 'Conjunction', features: '1A.....', value: 'then' }
 * ~\wd ~\tg ~\lu )             => { type: '', label: '', features: '', value: ')' }
 * ~\wd ~\tg .-~\lu .           => { type: '.', label: 'period', features: '', value: '.' }
 * ~\\wd ~\\tg R-~\\lu |        => { type: 'R', label: 'Paragraph', features: '', value: '|' }
 */
export async function transform_semantic_encoding(db: D1Database, semantic_encoding: string): Promise<SourceEntity[]> {
	const EXTRACT_TYPE_FEATURES_VALUES = /~\\wd ~\\tg (?:([\w.])-([^~]*))?~\\lu ([^~]+)/g
	const entities = [...semantic_encoding.matchAll(EXTRACT_TYPE_FEATURES_VALUES)]

	const all_features = await load_feature_map(db)

	return entities.map(decode_entity)

	// ['~\wd ~\tg N-1A1SDAnK3NN........~\lu God', 'N', '1A1SDAnK3NN........', 'God']
	function decode_entity(entity_match: RegExpMatchArray): SourceEntity {
		const category_code = entity_match[1] ?? ''
		const feature_codes = entity_match[2] ?? ''
		const value = entity_match[3]

		const category = CATEGORY_NAME_LOOKUP.get(category_code) || ''
		const category_abbr = CATEGORY_ABBREVIATIONS.get(category) || ''
		const ontology_data = decode_concept_data(value, category, feature_codes)
		const features = decode_features(feature_codes, category, all_features)

		return {
			category,
			category_abbr,
			value,
			...features,
			...ontology_data,
		}
	}
}

type FeatureValueInfo = { value: FeatureValue, code: string }
type FeatureInfo = { name: FeatureName, values: FeatureValueInfo[] }
type FeatureMap = Map<CategoryName, FeatureInfo[]>

async function load_feature_map(db: D1Database): Promise<FeatureMap> {
	const sql = 'SELECT * FROM Features'
	const { results } = await db.prepare(sql).all<DbFeature>()

	const grouped_by_category = Map.groupBy(results, ({ category }) => category)
	const feature_map_entries = [...grouped_by_category.entries().map(by_feature_name)]
	return new Map(feature_map_entries)

	function by_feature_name(category_entry: [CategoryName, DbFeature[]]): [CategoryName, FeatureInfo[]] {
		const [category, features] = category_entry
		const infos = [...Map.groupBy(features, ({ feature }) => feature).entries()]
			.toSorted(([, db_features]) => db_features[0].position)
			.map(([name, db_features]) => ({ name, values: db_features }))
		return [category, infos]
	}
}

function decode_features(raw_feature_codes: string, category: CategoryName, all_features: FeatureMap): SourceFeatures {
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
	const all_features = await load_feature_map(db)

	return source_entities.map(entity => {
		const { category, features } = entity
		const feature_codes = feature_structure_to_codes(category, features, all_features)
		// fill in any missing features in the structure
		const new_features = feature_codes_to_structure(category, feature_codes, all_features)
		return { ...entity, feature_codes, features: new_features }
	})
}

function decode_concept_data(value: string, category: CategoryName, raw_feature_codes: string): SourceConceptData {
	if (!WORD_ENTITY_CATEGORIES.has(category)) {
		return { concept: null, pairing_concept: null, pairing_type: '' }
	}

	const sense = raw_feature_codes[1]

	// follower/Adisciple -> follower / disciple-A
	const EXTRACT_PAIRING = /^(.+?)([\\/])([A-Z])(.+)$/
	const match = value.match(EXTRACT_PAIRING)
	if (match) {
		const [, stem, pairing_type, pairing_sense, pairing_stem] = match
		return {
			concept: {
				stem,
				sense,
				part_of_speech: category,
			},
			pairing_concept: {
				stem: pairing_stem,
				sense: pairing_sense,
				part_of_speech: category,
			},
			pairing_type,
		}
	}

	return {
		concept: {
			stem: value,
			sense,
			part_of_speech: category,
		},
		pairing_concept: null,
		pairing_type: '',
	}
}

function encode_concept_data(entity: SourceEntity): { value: string } {
	if (entity.concept && entity.pairing_concept) {
		return { value: `${entity.concept.stem}${entity.pairing_type}${entity.pairing_concept.sense}${entity.pairing_concept.stem}` }
	} else if (entity.concept) {
		return { value: entity.concept.stem }
	} else {
		return { value: entity.value }
	}
}

export function structure_semantic_encoding(entities: SourceEntity[]): PageSourceEntity[] {
	const new_entities: PageSourceEntity[] = entities.map((entity, i) => ({ ...entity, id: i, parent_id: -1, boundary_category: '' }))

	const parent_id_stack: number[] = []
	for (const [i, entity] of new_entities.entries()) {
		entity.parent_id = parent_id_stack.at(-1) ?? -1

		if (is_boundary_start(entity)) {
			entity.boundary_category = entity.category_abbr
			parent_id_stack.push(i)

		} else if (is_boundary_end(entity)) {
			entity.boundary_category = new_entities[entity.parent_id].boundary_category
			parent_id_stack.pop()
		}
	}

	return new_entities
}

export function get_noun_list(source: Source): NounListEntry[] {
	const noun_list_start = source.semantic_encoding.lastIndexOf('~|') // this indicates the start of the noun list
	return source.semantic_encoding
		.slice(noun_list_start + 2).trim()
		.split('|')
		.filter(entry => entry.length)
		.map((entry, index) => ({
			noun: `${entry.slice(1)}-${entry[0]}`,	// the sense is always the first letter
			index: index < 9 ? `${index + 1}` : String.fromCharCode('A'.charCodeAt(0) + (index - 9)),
		}))
}
