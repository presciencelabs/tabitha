import type { D1Database } from '@cloudflare/workers-types'
import { is_boundary_end, is_boundary_start } from './entity_filters'

const CATEGORY_NAME_LOOKUP = new Map([
	['N', 'Noun'],
	['V', 'Verb'],
	['A', 'Adjective'],
	['a', 'Adverb'],
	['P', 'Adposition'],
	['C', 'Conjunction'],
	['p', 'Phrasal'],
	['r', 'Particle'],
	['n', 'Noun Phrase'],
	['v', 'Verb Phrase'],
	['j', 'Adjective Phrase'],
	['d', 'Adverb Phrase'],
	['c', 'Clause'],
	['R', 'Paragraph'],
	['E', 'Section'],
	['.', 'period'],
])

const CATEGORY_ABBREVIATIONS = new Map([
	['Noun', 'N'],
	['Verb', 'V'],
	['Adjective', 'Adj'],
	['Adverb', 'Adv'],
	['Adposition', 'Adp'],
	['Conjunction', 'Con'],
	['Phrasal', 'Phr'],
	['Particle', 'Par'],
	['Noun Phrase', 'NP'],
	['Verb Phrase', 'VP'],
	['Adjective Phrase', 'AdjP'],
	['Adverb Phrase', 'AdvP'],
	['Clause', 'C'],
	['Paragraph', 'R'],
	['Section', 'E'],
	['period', 'period'],
])

const WORD_ENTITY_CATEGORIES = new Set(['Noun', 'Verb', 'Adjective', 'Adverb', 'Adposition', 'Conjunction', 'Phrasal', 'Particle'])

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

	const all_features = await load_features(db)

	return entities.map(decode_entity)

	// ['~\wd ~\tg N-1A1SDAnK3NN........~\lu God', 'N', '1A1SDAnK3NN........', 'God']
	function decode_entity(entity_match: RegExpMatchArray): SourceEntity {
		const category_code = entity_match[1] ?? ''
		const feature_codes = entity_match[2] ?? ''
		const value = entity_match[3]

		const category = CATEGORY_NAME_LOOKUP.get(category_code) || ''
		const category_abbr = CATEGORY_ABBREVIATIONS.get(category) || ''
		const features = transform_features(feature_codes, category_code, all_features)
		const ontology_data = get_concept_data(value, category, feature_codes)

		return {
			category,
			category_abbr,
			value,
			...features,
			...ontology_data,
		}
	}
}

async function load_features(db: D1Database): Promise<Map<string, DbFeature[]>> {
	const sql = 'SELECT * FROM Features'
	const { results } = await db.prepare(sql).all<DbFeature>()
	return Map.groupBy(results, ({ category, position }) => `${category}:${position}`)
}

function transform_features(feature_codes: string, category_code: string, all_features: Map<string, DbFeature[]>): SourceFeatures {
	if (!feature_codes.length) {
		return { feature_codes, features: [] }
	}

	const category = CATEGORY_NAME_LOOKUP.get(category_code) ?? ''

	if (WORD_ENTITY_CATEGORIES.has(category)) {
		// The first feature is the semantic complexity level, which is set during generation.
		// It is therefore meaningless at this stage and can be dropped.

		// The second feature is the lexical sense, which is treated specially elsewhere.
		// So it too can be dropped from the features.

		feature_codes = feature_codes.slice(2)
	}

	// The first feature on a Noun is the Noun List Index, and its value is just the character itself.
	// This feature is not included in the 'Features' database, and so needs to be handled separately.
	const is_noun = category === 'Noun'

	const features = [...feature_codes].map((feature_code, index) => get_feature_value(category, is_noun ? index - 1 : index, feature_code, all_features))

	if (is_noun) {
		// at this point, entity_features[0] is an empty value
		features[0] = { name: 'Noun List Index', value: feature_codes[0] }
	}

	return {
		feature_codes,
		features,
	}
}

function get_feature_value(category: CategoryName, position: number, feature_code: string, all_features: Map<string, DbFeature[]>): EntityFeature {
	// Add 1 to position because the position in the db is not zero-based like an index
	const result = all_features.get(`${category}:${position + 1}`)?.find(({ code }) => code === feature_code)
	return {
		name: result?.feature ?? '',
		value: result?.value ?? '',
	}
}

function get_concept_data(value: string, category: string, feature_codes: string): SourceConceptData {
	if (!WORD_ENTITY_CATEGORIES.has(category)) {
		return { concept: null, pairing_concept: null, pairing_type: '' }
	}

	const sense = feature_codes[1]

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
