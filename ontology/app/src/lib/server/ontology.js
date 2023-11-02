import {transform_categories, transform_examples, transform_exhaustive_examples, transform_occurrences} from './transformers'

/**
 * case-insensitive match, will accept % as a wildcard
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(filter: string) => Promise<Concept[]>}
 */
export const get_concepts = db => async filter => {
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	// https://developers.cloudflare.com/d1/platform/client-api/#searching-with-like
	// https://developers.cloudflare.com/d1/platform/client-api/#parameter-binding
	const sql = `
		SELECT *
		FROM Concepts
		WHERE roots like ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<DbRowConcept>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const {results} = await db.prepare(sql).bind(filter).all()

	return normalize(results)
}

/**
 * @param {DbRowConcept[]} matches_from_db
 *
 * @returns {Concept[]}
 */
function normalize(matches_from_db) {
	const transformed_matches = matches_from_db.map(transform)

	const augmented_matches = add_senses(transformed_matches)

	return augmented_matches

	/**
	 * @param {DbRowConcept} match_from_db
	 *
	 * @returns {TransformedConcept}
	 */
	function transform(match_from_db) {
		return {
			...match_from_db,

			categories: transform_categories(match_from_db.categories),
			examples: transform_examples(match_from_db.examples),
			exhaustive_examples: transform_exhaustive_examples(match_from_db.exhaustive_examples),
			occurrences: transform_occurrences(match_from_db.occurrences),
		}
	}

	/**
	 * @param {TransformedConcept[]} concepts
	 *
	 * @returns {AugmentedConcept[]}
	 */
	function add_senses(concepts) {
		const sensed_concepts = []
		const root_sense_tracker = new Map()

		for (const concept of concepts.sort(by_id)) {
			const {roots} = concept

			if (!root_sense_tracker.has(roots)) {
				root_sense_tracker.set(roots, 'A')
			}

			const sense = root_sense_tracker.get(roots)

			sensed_concepts.push({
				...concept,
				sense,
			})

			root_sense_tracker.set(roots, next_sense(sense))
		}

		return sensed_concepts

		/**
		 * @param {TransformedConcept} a
		 * @param {TransformedConcept} b
		 *
		 * @returns {number}
		 */
		function by_id(a, b) {
			return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
		}

		/**
		 * @param {string} sense
		 *
		 * @returns {string}
		 */
		function next_sense(sense) {
			return String.fromCharCode(sense.charCodeAt(0) + 1)
		}
	}
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {Promise<string>}
 */
export async function get_version(db) {
	const sql = `
		SELECT Version
		FROM OntologyVersion
	`

	/** @type {string} https://developers.cloudflare.com/d1/platform/client-api/#await-stmtfirstcolumn */
	const version = await db.prepare(sql).first('Version') || ''

	return version
}
