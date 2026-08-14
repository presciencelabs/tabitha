import { curated_example_category_codes, curated_example_feature_codes, semantic_category, sources, theta_grid, usage_info } from '$lib/lookups'

/**
 * @param {string} curated_examples_raw "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {CuratedExample[]}
 */
export function transform_curated_examples(curated_examples_raw) {
	const encoded_examples = curated_examples_raw.split('\n').filter(field => !!field)
	// beautiful-A:
	//   4,2,2,2|(NPA|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	//   4,17,2,2|(NPA|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.
	//   4,40,6,29|(NPA|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothes are more beautiful than Solomon's clothes.
	// be-V:
	//   6,8,1,67|[A|(NPA|John|)|(VP|read|)|(NPP|book|)|]|(VP|be|)|(APP|true|)|~It is true that John read that book.
	//   4,41,14,21|[A|(NPA|man|)|(VP|born|)|(aP|never|)|]|(VP|be|)|(APP|good|)|(NPB|man|)|~It's better for that man that he was never born.

	return encoded_examples.map(decode)

	/**
	 * @param {string} encoded_example 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	 *
	 * @returns {CuratedExample}
	 */
	function decode(encoded_example) {
		const parts = encoded_example.split('|')
		const encoded_reference = parts[0] // '4,2,2,2'
		const encoded_entities = parts.slice(1, -1) // ['(NPA', 'baby', ')', '(VP', 'be', ')', '(APP', 'beautiful', ')']
		const sentence = parts.at(-1)?.slice(1) || '' // The baby was beautiful. (ignore the '~')

		return {
			reference: decode_reference(encoded_reference),
			encoding: decode_simplified_encoding(encoded_entities),
			sentence,
		}

		/**
		 * @param {string[]} encoded_entities ['(NPA', 'baby', ')', '(VP', 'be', ')', '(APP', 'beautiful', ')']
		 *
		 * @returns {SimplifiedSemanticEncoding}
		 */
		function decode_simplified_encoding(encoded_entities) {
			const entities = encoded_entities.map(decode_entity)

			return entities

			/**
			 * @param {string} encoded_entity '(NPp', 'baby', ')', etc
			 *
			 * @returns {SimplifiedEncodingEntity}
			 */
			function decode_entity(encoded_entity) {
				// (NPA => { category: 'NP', value: '(', feature: { code: 'A', value: 'Most Agent-like' } }
				// baby => { category: 'value', value: 'baby', feature: undefined }
				// ) => { category: 'Phrase end', value: ')', feature: undefined }
				// (VP => { category: 'VP', value: '(', feature: undefined }
				// (APP => { category: 'AdjP', value: '(', feature: { code: 'P', value: 'Predicative' } }
				// [A => { category: 'Clause', value: '[', feature: { code: 'A', value: 'Agent' } }

				const category = Object.entries(curated_example_category_codes).find(([code]) => encoded_entity.startsWith(code))?.[1] || 'Word'
				const feature_code = encoded_entity.at(-1) || ''
				const feature_value = curated_example_feature_codes[category]?.[feature_code]
				return {
					category,
					word: category === 'Word' ? encoded_entity : undefined,
					feature: feature_value ? { code: feature_code, value: feature_value } : undefined,
				}
			}
		}
	}
}

/**
 * @param {string} encoded_reference four numbers separated by a comma
 *
 * @returns {Reference}
 */
function decode_reference(encoded_reference) {
	const [type_key, primary_key, id_secondary, id_tertiary] = encoded_reference.split(',').map(Number)
	const [type, primary_keys] = Array.from(sources.entries())[type_key]

	return {
		type,
		id_primary: primary_keys[primary_key],
		id_secondary: id_secondary + '',
		id_tertiary: id_tertiary + '',
	}
}

/**
 * @type {Record<string, (categories_from_db: string) => string[]>}
 */
const categorization_decoders = {
	Adjective: transform_adjective_categorization,
	Adposition: transform_particle_categorization('Adposition'),
	Adverb: transform_particle_categorization('Adverb'),
	Conjunction: transform_particle_categorization('Conjunction'),
	Noun: transform_noun_categorization,
	Verb: transform_verb_categorization,
}

/**
 * @param {string} part_of_speech
 * @param {string} categorization
 *
 * @returns {string[]}
 */
export function decode_categorization(part_of_speech, categorization) {
	const decoder = categorization_decoders[part_of_speech]

	return decoder ? decoder(categorization) : [...categorization]
}

/**
 * @param {string} categories_from_db '[Aa_][Bb_][Cc_][Dd_][Ee_][Ff_][Gg_][Hh_][Ii_]'
 *
 * @returns {string[]} The decoded categories, e.g., ['Agent-like', '(Patient-like)', '', '', '', '', '', '', '']
 */
function transform_verb_categorization(categories_from_db) {
	const encoded_categories = [...categories_from_db]

	return decode(encoded_categories)

	/**
	 * @param {string[]} encoded_categories various combinations of A-I, a-i and _, e.g., ['A', 'b', '_', '_', '_', '_', '_', '_', '_']
	 */
	function decode(encoded_categories) {
		return encoded_categories.filter(populated).map(encoded_category => theta_grid[encoded_category])

		/**
		 * @param {string} encoded_category
		 */
		function populated(encoded_category) {
			const EMPTY = '_'

			return encoded_category !== EMPTY
		}
	}
}

/**
 * @param {string} categories_from_db '[GCOFQIL][Aa_][Bb_][Cc_][Dd_][Ee_][Ff_]' OR ''
 *
 * position 1 is the semantic category, the remaining positions are the usage, see DisplayOntologyDlg.cppL1064
 *
 * @returns {string[]}
 */
function transform_adjective_categorization(categories_from_db) {
	if (!categories_from_db) {
		return []
	}

	const [encoded_semantic_category, ...encoded_usage] = categories_from_db

	return [
		semantic_category.Adjective[encoded_semantic_category],
		// @ts-expect-error TODO: look into a fix for this type mismatch warning
		...transform_particle_categorization('Adjective')(encoded_usage),
	]
}

/**
 * @param {string} categories_from_db '[AFGMOTgo]' OR ''
 *
 * @returns {string[]} – e.g., ['Abstracts'] or ['Feminine names'] or ['Not yet categorized']
 */
function transform_noun_categorization(categories_from_db) {
	return [
		semantic_category.Noun[categories_from_db[0]] || 'No information available yet.',
	]
}

/**
 * @param {Concept['part_of_speech']} part_of_speech
 *
 * @returns {(categories_from_db: string) => string[]}
 */
function transform_particle_categorization(part_of_speech) {
	return decode_categories

	/**
	 * @param {string} categories_from_db
	 *
	 * @returns {string[]}
	 */
	function decode_categories(categories_from_db) {
		if (!categories_from_db) {
			return []
		}

		return [...decode_usage([...categories_from_db])]

		/**
		 * Encoding is a combination of position and case, letters are actually irrelevant.
		 *
		 * @param {string[]} encoded_usage ['Aa_', 'Bb_', 'Cc_']
		 *
		 * @returns {string[]} - various sentences from the usage_info lookup
		 */
		function decode_usage(encoded_usage) {
			return encoded_usage.map((character, i) => `${decode_frequency(character)} ${usage_info[part_of_speech][i]}`)
		}

		/**
		 * @param {string} character - uppercase or lowercase or underscore
		 * @returns {string} - "always" or "sometimes" or "never", respectively
		 */
		function decode_frequency(character) {
			return character === '_' ? 'never' : character === character.toUpperCase() ? 'always' : 'sometimes'
		}
	}
}

/**
 * @type {Record<string, (categories: string[]) => string>}
 */
const categorization_encoders = {
	Adjective: encode_adjective_categorization,
	Adposition: encode_usage_categorization('Adposition'),
	Adverb: encode_usage_categorization('Adverb'),
	Conjunction: encode_usage_categorization('Conjunction'),
	Noun: encode_noun_categorization,
	Verb: encode_verb_categorization,
}

/**
 * @param {string} part_of_speech
 * @param {string[]} categories
 *
 * @returns {string}
 */
export function encode_categorization(part_of_speech, categories) {
	const encoder = categorization_encoders[part_of_speech]

	return encoder ? encoder(categories) : ''
}

/**
 * @param {string[]} categories
 *
 * @returns {string} – e.g., '[AFGMOTgo]' OR ''
 */
function encode_noun_categorization(categories) {
	// Noun categorization is just one letter
	const category = categories[0]
	if (!category) {
		// Default to 'All other objects'
		return 'o'
	}
	return Object.entries(semantic_category['Noun']).find(([, value]) => value === category)?.[0] || 'o'
}

/**
 * @param {string[]} categories 
 * @returns {string}
 */
function encode_verb_categorization(categories) {
	// invert the theta_grid map
	const argument_map = Object.fromEntries(Object.entries(theta_grid).map(([letter, category]) => [category, letter]))
	return categories.map(category => argument_map[category]).join('')
}

/**
 * @param {string[]} categories
 *
 * position 1 is the semantic category, the remaining positions are the usage, see DisplayOntologyDlg.cppL1064
 *
 * @returns {string} - '[GCOFQIL][Aa_][Bb_][Cc_][Dd_][Ee_][Ff_]'
 */
function encode_adjective_categorization(categories) {
	if (categories.length === 0) {
		// default to 'Generic', and all 'never'
		return `G${'_'.repeat(usage_info['Adjective'].length)}`
	}

	const [category, ...usages] = categories
	const encoded_category = Object.entries(semantic_category['Adjective']).find(([, value]) => value === category)?.[0] || 'G'

	return `${encoded_category}${encode_usage_categorization('Adjective')(usages)}`
}

/**
 * @param {Concept['part_of_speech']} part_of_speech
 *
 * @returns {(categories: string[]) => string}
 */
function encode_usage_categorization(part_of_speech) {
	return encode_categories

	/**
	 * @param {string[]} categories
	 *
	 * @returns {string}
	 */
	function encode_categories(categories) {
		const usages = usage_info[part_of_speech]

		if (categories.length === 0) {
			return '_'.repeat(usages.length)
		}

		return categories.map(encode_usage).join('')

		/**
		 * @param {string} sentence - the full usage sentence starting with 'always', 'sometimes', or 'never'
		 * @param {number} i - the position within the categorization string
		 * @returns {string} - the categorization character [ABC|abc|_]
		 */
		function encode_usage(sentence, i) {
			return encode_frequency(sentence, get_usage_character(i))
		}

		/**
		 * @param {string} sentence starting with "always" or "sometimes" or "never"
		 * @param {string} character the position-based upper-case character
		 * @returns {string} - an uppercase character, lowercase character, or '_'
		 */
		function encode_frequency(sentence, character) {
			return sentence.startsWith('never') ? '_' : sentence.startsWith('always') ? character : character.toLowerCase()
		}

		/**
		 * @param {number} i 
		 */
		function get_usage_character(i) {
			return String.fromCharCode('A'.charCodeAt(0) + i)
		}
	}
}
