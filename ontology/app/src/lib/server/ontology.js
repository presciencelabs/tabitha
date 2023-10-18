// https://vitejs.dev/guide/env-and-mode.html
import {DB_PATH} from '$env/static/private'
import Database from 'better-sqlite3'

// TODO: review best practices:  https://github.com/WiseLibs/better-sqlite3/blob/master/docs/tips.md#helpful-tips-for-sqlite3

/** @type {import('better-sqlite3').Database} */
let db

export function open_connection() {
	console.info('attempting to load database from: ', DB_PATH)

	// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
	db = new Database(DB_PATH, {
		readonly: true,
		fileMustExist: true,
	})

	console.info('database loaded and connected:', db)
}

/**
 * @returns {Concept[]}
 */
export function get_all_concepts() {
	const sql = `
		SELECT *
		FROM Concepts
	`
	const results = db.prepare(sql).all()

	return normalize(/** @type {DbRow[]} */ (results))
}

/**
 * case-insensitive, wilcard on both sides of search term, i.e., the filter
 *
 * @param {string} filter
 *
 * @returns {Concept[]}
 * */
export function get_some_concepts(filter) {
	const sql = `
		SELECT *
		FROM Concepts
		WHERE roots LIKE @param
	`

	// following references helped in implementing a wildcard search, i.e., '%...%', the user's input will match if it appears anywhere in the target
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#binding-parameters
	// https://github.com/WiseLibs/better-sqlite3/issues/405#issuecomment-636453933
	//
	// don't want prettier to flatten this line
	// prettier-ignore
	const results = db.prepare(sql)
							.all({param: `%${filter}%`})

	return normalize(/** @type {DbRow[]} */ (results))
}

/**
 * @param {DbRow[]} matches_from_db
 *
 * @returns {Concept[]}
 * */
function normalize(matches_from_db) {
	return matches_from_db.map(transform)

	/**
	 * @param {DbRow} match_from_db
	 *
	 * @returns {Concept}
	 */
	function transform(match_from_db) {
		return {
			...match_from_db,

			examples: transform_examples(match_from_db.examples),
			exhaustive_examples: transform_exhaustive_examples(match_from_db.exhaustive_examples),
			occurrences: Number(match_from_db.occurrences),
		}
	}
}

/**
 * @param {string} examples_from_db "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {Example[]}
 * */
function transform_examples(examples_from_db) {
	const encoded_examples = examples_from_db.split('\n').filter(field => !!field)
	// 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	// 4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.
	// 4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.

	return encoded_examples.map(decode)

	/**
	 * @param {string} encoded_example 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	 *
	 * @returns {Example}
	 * */
	function decode(encoded_example) {
		const encoded_references = encoded_example.match(/^(\d+,?)*/)?.[0] || '' // 4,2,2,2

		return {
			references: encoded_references.split(','),
			semantic_representation: encoded_example.match(/(\|.*\|)~/)?.[1] || '', // |(NPp|baby|)|(VP|be|)|(APP|beautiful|)|
			sentence: encoded_example.match(/~(.*\.)/)?.[1] || '', // The baby was beautiful.
		}
	}
}

/**
 * @param {string} exhaustive_examples_from_db '4|41|15|36|N|||wineA||\n4|41|15|36|N|||wineA||\n'
 *
 * @returns
 * */
function transform_exhaustive_examples(exhaustive_examples_from_db) {
	const encoded_exhaustive_examples = exhaustive_examples_from_db.split('\n').filter(field => !!field)
	// 4|41|15|36|N|||wineA||
	// 4|41|15|36|N|||wineA||

	return encoded_exhaustive_examples.map(decode)

	/**
	 * @param {string} encoded_exhaustive_example 4|41|15|36|N|||wineA||
	 *
	 * @returns
	 * */
	function decode(encoded_exhaustive_example) {
		//TODO: need to learn what each of those fields mean.
		return encoded_exhaustive_example
	}
}
