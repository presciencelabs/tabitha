/**
 * @param {string} examples_from_db "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {Example[]}
 */
export function transform_examples(examples_from_db) {
	const encoded_examples = examples_from_db.split('\n').filter(field => !!field);
	// 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	//		4 = src_text 4=eng Bible (there are 0-7 for other sources but the majority of the ontology db should be 4...AI: verify this:  glove, e.g., not in Bible:  but it used in a story...)
	//		2 = book number, Gen = 1
	//		2 = chapter
	//		2 = verse
	// 4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.
	// 4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothes are more beautiful than Solomon's clothes.
	return encoded_examples.map(decode);

	/**
	 * @param {string} encoded_example 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	 *
	 * @returns {Example}
	 */
	function decode(encoded_example) {
		const encoded_references = encoded_example.match(/^(\d+,?)*/)?.[0] || ''; // 4,2,2,2

		return {
			references: encoded_references.split(','),
			semantic_representation: encoded_example.match(/(\|.*\|)~/)?.[1] || '',
			sentence: encoded_example.match(/~(.*\.)/)?.[1] || '', // The baby was beautiful.
		};
	}
}

/**
 * @param {string} exhaustive_examples_from_db '4|41|15|36|N|||wineA||\n4|41|15|36|N|||wineA||\n'
 *
 * @returns {string[]}
 */
export function transform_exhaustive_examples(exhaustive_examples_from_db) {
	const encoded_exhaustive_examples = exhaustive_examples_from_db.split('\n').filter(field => !!field);
	// 4|41|15|36|N|||wineA||
	// 	encoding is the same as example above.
	// 4|41|15|36|N|||wineA||
	return encoded_exhaustive_examples.map(decode);

	/**
	 * @param {string} encoded_exhaustive_example 4|41|15|36|N|||wineA||
	 *
	 * @returns {string}
	 * */
	function decode(encoded_exhaustive_example) {
		return encoded_exhaustive_example;
	}
}

/**
 * @param {string} occurrences_from_db
 *
 * @returns {number}
 */
export function transform_occurrences(occurrences_from_db) {
	return Number(occurrences_from_db);
}

/**
 * @param {string} categories_from_db '[Aa_],[Bb_], [Cc_], [Dd_], [Ee_], [Ff_], [Gg_], [Hh_], [Ii_]' The letters are irrelevant, the position and case are what matters:
 *
 * | position | meaning 						|
 * | -------- | -------------------------	|
 * | 0        | Agent-like 					|
 * | 1        | Patient-like 					|
 * | 2        | State 							|
 * | 3        | Source 							|
 * | 4        | Destination 					|
 * | 5        | Instrument 					|
 * | 6        | Beneficiary 					|
 * | 7        | Patient proposition 		|
 * | 8        | Participant proposition	|
 *
 * Uppercase means required, lowercase means optional and an underscore('_') in any position means not applicable.
 */
export function transform_categories(categories_from_db) {
	const encoded_categories = [...categories_from_db]

	const grid = initialize_theta_grid()

	return decode(encoded_categories)(grid)

	function initialize_theta_grid() {
		const required = {
			A: 'Agent-like',
			B: 'Patient-like',
			C: 'State',
			D: 'Source',
			E: 'Destination',
			F: 'Instrument',
			G: 'Beneficiary',
			H: 'Patient proposition',
			I: 'Participant proposition',
		}

		const optional = Object.entries(required).reduce(lowercase_and_parens, {})

		return {
			...required,
			...optional,
			_: '',
		}

		/**
		 * @param {Record<string,string>} optional The new object being created that holds lowercase keys and parenthesized values.
		 * @param {[string,string]} current_record
		 *
		 * @returns {Record<string,string>}
		 */
		function lowercase_and_parens(optional, [key, value]) {
			optional[key.toLowerCase()] = `(${value})`

			return optional
		}
	}

	/**
	 * @param {string[]} encoded_categories various combinations of A-I, a-i and _, e.g., ['A', 'b', '_', '_', '_', '_', '_', '_', '_']
	 *
	 * @returns {(grid: Record<string,string>) => string[]} The decoded categories, e.g., ['Agent-like', '(Patient-like)', '', '', '', '', '', '', '']
	 */
	function decode(encoded_categories) {
		return grid => encoded_categories.filter(populated).map(decode_category(grid))

		/**
		 * @param {string} encoded_category
		 */
		function populated(encoded_category) {
			const EMPTY = '_'

			return encoded_category !== EMPTY
		}

		/**
		 * @param {Record<string,string>} grid
		 *
		 * @returns {(encoded_category: string) => string}
		 */
		function decode_category(grid) {
			return encoded_category => grid[encoded_category]
		}
	}
}