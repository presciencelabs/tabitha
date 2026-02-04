import { semantic_category, sources, theta_grid, usage_info } from '$lib/lookups'

/**
 * @param {string} curated_examples_raw "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {CuratedExample[]}
 */
export function transform_curated_examples(curated_examples_raw) {
	const encoded_examples = curated_examples_raw.split('\n').filter(field => !!field)
	// 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	// 4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.
	// 4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothes are more beautiful than Solomon's clothes.
	return encoded_examples.map(decode)

	/**
	 * @param {string} encoded_example 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	 *
	 * @returns {CuratedExample}
	 */
	function decode(encoded_example) {
		const encoded_reference = encoded_example.split('|')[0] // '4,2,2,2'
		const simplified_semantic_encoding = encoded_example.match(/\|(.*)\|~/)?.[1] || '' // (NPp|baby|)|(VP|be|)|(APP|beautiful|)

		return {
			reference: decode_reference(encoded_reference),
			encoding: decode_simplified_encoding(simplified_semantic_encoding),
			sentence: encoded_example.split('~')[1], // The baby was beautiful.
		}

		/**
		 * @param {string} simplified_semantic_encoding '(NPp|baby|)|(VP|be|)|(APP|beautiful|)'
		 *
		 * @returns {SimplifiedSemanticEncoding}
		 */
		function decode_simplified_encoding(simplified_semantic_encoding) {
			const encoded_phrases = simplified_semantic_encoding.match(/\([^)]+\|[^)]+\)/g) || [] // ['(NPp|baby|)', '(VP|be|)', '(APP|beautiful|)']

			const argument_phrases = encoded_phrases.map(decode_phrase)

			return argument_phrases

			/**
			 * @param {string} encoded_phrase '(NPp|baby|)'
			 *
			 * @returns {SimplifiedEncodingPhrase}
			 */
			function decode_phrase(encoded_phrase) {
				const [type, word] = encoded_phrase.replace(/[()]/g, '').split('|') // ['NPp', 'baby']
				const part_of_speech = `${type[0]}${type[1]}` //'NP' or 'VP' or 'AP'
				const role = type[2] || '' // 'p' or '' or 'P'

				// (NPp|baby|) => { part_of_speech: 'NP', role: 'p', word: 'baby' }
				// (VP|be|) => { part_of_speech: 'VP', role: '', word: 'be' }
				// (APP|beautiful|) => { part_of_speech: 'AP', role: 'P', word: 'beautiful' }
				return {
					part_of_speech,
					role,
					word,
				}
			}
		}
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
export function transform_categorization(part_of_speech, categorization) {
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
