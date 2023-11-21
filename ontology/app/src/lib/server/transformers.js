import { semantic_category, sources, theta_grid, usage_info } from './lookups'


/**
 * @param {DbRowConcept} match_from_db
 *
 * @returns {TransformedConcept}
 */
export function transform(match_from_db) {
	return {
		...match_from_db,

		categories: transform_categorization(match_from_db),
		examples: transform_examples(match_from_db.examples),
		exhaustive_examples: transform_exhaustive_examples(match_from_db.exhaustive_examples),
		occurrences: transform_occurrences(match_from_db.occurrences),
	}
}

/**
 * @param {string} examples_from_db "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {Example[]}
 */
function transform_examples(examples_from_db) {
	const encoded_examples = examples_from_db.split('\n').filter(field => !!field)
	// 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	// 4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.
	// 4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothes are more beautiful than Solomon's clothes.
	return encoded_examples.map(decode)

	/**
	 * @param {string} encoded_example 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	 *
	 * @returns {Example}
	 */
	function decode(encoded_example) {
		const encoded_reference = encoded_example.split('|')[0] // '4,2,2,2'
		const encoded_semantic_representation = encoded_example.match(/\|(.*)\|~/)?.[1] || '' // (NPp|baby|)|(VP|be|)|(APP|beautiful|)

		return {
			reference: decode_reference(encoded_reference),
			semantic_representation: decode_semantic_representation(encoded_semantic_representation),
			sentence: encoded_example.split('~')[1], // The baby was beautiful.
		}

		/**
		 * @param {string} encoded_semantic_representation '(NPp|baby|)|(VP|be|)|(APP|beautiful|)'
		 *
		 * @returns {SemanticRepresentation}
		 */
		function decode_semantic_representation(encoded_semantic_representation) {
			const encoded_phrases = encoded_semantic_representation.match(/\([^)]+\|[^)]+\)/g) || [] // ['(NPp|baby|)', '(VP|be|)', '(APP|beautiful|)']

			const semantic_representation = encoded_phrases.map(decode_phrase)

			return semantic_representation

			/**
			 * @param {string} encoded_phrase '(NPp|baby|)'
			 *
			 * @returns {Phrase}
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
 * @param {string} exhaustive_examples_from_db various encoding formats, here's one example '4|41|15|36|N|||wineA||\n4|41|15|36|N|||wineA||\n'
 *
 * @returns {ExhaustiveExample[]}
 */
function transform_exhaustive_examples(exhaustive_examples_from_db) {
	const encoded_exhaustive_examples = exhaustive_examples_from_db.split('\n').filter(field => !!field)

	return encoded_exhaustive_examples.map(decode)

	/**
	 * @param {string} encoded_exhaustive_example 4|41|15|36|N|||wineA|| or 4|19|23|6|followA|A or 4|1|20|13|p|A|SarahA|AbrahamA|||||||
	 *
	 * @returns {ExhaustiveExample}
	 * */
	function decode(encoded_exhaustive_example) {
		const [source, book, chapter, verse, ...rest] = encoded_exhaustive_example.split('|')

		return {
			reference: decode_reference([source, book, chapter, verse].join(',')),
			unknown_encoding: rest.join('|'),
		}
	}
}

/**
 * @param {string} occurrences_from_db
 *
 * @returns {number}
 */
function transform_occurrences(occurrences_from_db) {
	return Number(occurrences_from_db)
}

/**
 * @type {Record<string, (categories_from_db: string) => string[]>}
 */
const categorization_decoders = {
	Adjective: transform_adjective_categorization,
	Noun: transform_noun_categorization,
	Verb: transform_verb_categorization,
}

/**
 * @param {DbRowConcept} concept_from_db
 *
 * @returns {string[]}
 */
function transform_categorization({part_of_speech, categories}) {
	const decoder = categorization_decoders[part_of_speech]

	return decoder ? decoder(categories) : [...categories]
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

	const [encoded_semantic_category, ...encoded_usage] = [...categories_from_db]

	return [semantic_category.Adjective[encoded_semantic_category], ...decode_usage(encoded_usage)]

	/**
	 * Encoding is a combination of position and case, letters are actually irrelevant.
	 *
	 * @param {string[]} encoded_usage // ['Aa_', 'Bb_', 'Cc_', 'Dd_', 'Ee_', 'Ff_']
	 *
	 * @returns {string[]} - various permutations, e.g., ['never used attributively', ...]
	 */
	function decode_usage(encoded_usage) {
		return encoded_usage.map((character, i) => `${decode_frequency(character)} ${usage_info[i]}`)
	}

	/**
	 * @param {string} character - uppercase or lowercase or underscore
	 * @returns {string} - "always" or "sometimes" or "never", respectively
	 */
	function decode_frequency(character) {
		return character === '_' ? 'never' : character === character.toUpperCase() ? 'always' : 'sometimes'
	}
}

/**
 * @param {string} encoded_reference four numbers separated by a comma
 *
 * @returns {Reference}
 */
function decode_reference(encoded_reference) {
	const [source_key, book_key, chapter, verse] = encoded_reference.split(',').map(Number)
	const [source, books] = Array.from(sources.entries())[source_key]

	return {
		source,
		book: books[book_key],
		chapter,
		verse,
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