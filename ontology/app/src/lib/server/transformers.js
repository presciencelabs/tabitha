import { books, theta_grid, sources } from './lookups';


/**
 * @param {string} examples_from_db "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {Example[]}
 */
export function transform_examples(examples_from_db) {
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
				const part_of_speech = `${type[0]}${type[1]}`//'NP' or 'VP' or 'AP'
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
export function transform_exhaustive_examples(exhaustive_examples_from_db) {
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
export function transform_occurrences(occurrences_from_db) {
	return Number(occurrences_from_db)
}

/**
 * @param {string} categories_from_db '[Aa_][Bb_][Cc_][Dd_][Ee_][Ff_][Gg_][Hh_][Ii_]'
 *
 * @returns {string[]} The decoded categories, e.g., ['Agent-like', '(Patient-like)', '', '', '', '', '', '', '']
 */
export function transform_categories(categories_from_db) {
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
 * @param {string} encoded_reference four numbers separated by a comma
 *
 * @returns {Reference}
 */
function decode_reference(encoded_reference) {
	const [
		source_key,
		book_key,
		chapter,
		verse,
	] = encoded_reference.split(',').map(Number)

	return {
		source: sources[source_key],
		book: books[book_key],
		chapter,
		verse,
	}
}
