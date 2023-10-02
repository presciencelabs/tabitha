import Database from 'better-sqlite3'

// TODO: review best practices:  https://github.com/WiseLibs/better-sqlite3/blob/master/docs/tips.md#helpful-tips-for-sqlite3

// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
const db = new Database('src/lib/server/Ontology.tabitha.sqlite', {
	readonly: true,
	fileMustExist: true,
})
// WAL mode doesn't seem necessary in the case of readonly:  https://www.sqlite.org/wal.html#overview

console.log('database loaded and connected', db)

/**
 * @typedef Concept
 * @property {number} id
 * @property {string} roots
 * @property {string} part_of_speech
 */

/** @returns {Concept[]} */
export function get_all_concepts() {
	return db.prepare('SELECT * FROM Concepts').all()
}

/**
 * case-insensitive, wilcard on both sides of search term, i.e., the filter
 * 
 * @param {string} filter 
 * @returns {Concept[]}
 */
export function get_some_concepts(filter) {
	// following references helped in implementing a wildcard search, i.e., '%...%', the user's input will match if it appears anywhere in the target
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	// https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#binding-parameters
	// https://github.com/WiseLibs/better-sqlite3/issues/405#issuecomment-636453933
	return /** @type {Concept[]} */ db.prepare('SELECT * FROM Concepts WHERE roots LIKE @param').all({param: `%${filter}%`})
}
