import {
	transform_examples,
	transform_exhaustive_examples,
	transform_occurrences,
} from './transformers'

/**
 * case-insensitive match, will accept % as a wildcard
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(filter: string) => Promise<Concept[]>}
 * */
export const get_concepts = db => async filter => {
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	// https://developers.cloudflare.com/d1/platform/client-api/#searching-with-like
	// https://developers.cloudflare.com/d1/platform/client-api/#parameter-binding
	const sql = `
		SELECT *
		FROM Concepts
		WHERE roots like ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<DbRow>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const {results} = await db.prepare(sql).bind(filter).all()

	return normalize(results)
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
			occurrences: transform_occurrences(match_from_db.occurrences),
		}
	}
}
