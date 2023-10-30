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
 * @param {string} categories_from_db
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
		}

		const optional = Object.entries(required).reduce(add_lowercase_and_parens, {})

		return {
			...required,
			...optional,
			_: '',
		}

		/**
		 * @param {Record<string,string>} optional
		 *
		 * @param {[string,string]}
		 *
		 * @returns {Record<string,string>}
		 */
		function add_lowercase_and_parens(optional, [key, value]) {
			optional[key.toLowerCase()] = `(${value})`

			return optional
		}
	}

	/**
	 * @param {string[]} encoded_categories
	 *
	 * @returns {(grid: Record<string,string>) => string[]}
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