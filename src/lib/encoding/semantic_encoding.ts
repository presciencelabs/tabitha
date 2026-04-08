import type { D1Database } from '@cloudflare/workers-types'
import { CATEGORY_ABBREVIATIONS, CATEGORY_NAME_LOOKUP, WORD_ENTITY_CATEGORIES } from './lookups'
import { load_source_feature_map, load_target_feature_map, decode_features } from './features'
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

	const all_features = await load_source_feature_map(db)

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

export async function transform_target_encoding(db: D1Database, semantic_encoding: string, project: string): Promise<TargetEntity[]> {
	// In addition to the source encoding, '~\z1' denotes the target word
	const EXTRACT_TYPE_FEATURES_VALUES = /~\\wd ~\\tg ([^~]+)?~\\lu ([^~]+)~\\z1 ?([^~]+)?/g
	const entities = [...semantic_encoding.matchAll(EXTRACT_TYPE_FEATURES_VALUES)]

	const all_features = await load_target_feature_map(project) || await load_source_feature_map(db)

	return entities.map(decode_entity)

	// ['~\wd ~\tg N-1A1SDAnK3NN........~\lu God~\z1 God', 'N-1A1SDAnK3NN........', 'God', 'God']
	function decode_entity(entity_match: RegExpMatchArray): TargetEntity {
		const category_code = entity_match[1]?.[0] || ''
		const is_user_defined = category_code === '&'

		const category = is_user_defined ? entity_match[1].slice(1) : CATEGORY_NAME_LOOKUP.get(category_code) || ''
		const category_abbr = is_user_defined ? category : CATEGORY_ABBREVIATIONS.get(category) || ''
		const raw_feature_codes = is_user_defined ? '' : entity_match[1]?.slice(2) || ''
		const { feature_codes, features, noun_list_index } = decode_features(raw_feature_codes, category, all_features)

		const value = entity_match[2]
		const concept = decode_concept_data(value, category, raw_feature_codes).concept
		const target = entity_match[3] || ''

		return {
			category,
			category_abbr,
			value,
			concept,
			target,
			feature_codes,
			features: features.map(({ value, name }) => ({ value, name: name || 'Unknown Lexical Feature' })),
			noun_list_index,
		}
	}
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
	// Encode the concept entity data back into the TBTA-compatible format for storage and generation
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
