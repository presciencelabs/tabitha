import { transform } from './transformers'

// refs:
// 	https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
// 	https://developers.cloudflare.com/d1/platform/client-api/#searching-with-like
// 	https://developers.cloudflare.com/d1/platform/client-api/#parameter-binding

/**
 * case-insensitive match, will accept % as a wildcard as well as sense-specific search, e.g., love-A
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(filter: string) => Promise<Concept[]>}
 */
export const get_concepts = db => async filter => {
	// senses follow the form word-A, /^(.*)-([A-Z])$/
	const matches = filter.match(/^(.*)-([A-Z])$/)
	if (matches) {
		const [, stem, sense] = matches
		return await by_sense({ stem, sense })
	}

	return await by_filter(filter)

	/**
	 * @param {{stem: string, sense: string}} input
	 * @returns {Promise<Concept[]>}
	 */
	async function by_sense({ stem, sense }) {
		const sql = `
			SELECT *
			FROM Concepts
			WHERE stem like ?
			AND sense = ?
		`

		/** @type {import('@cloudflare/workers-types').D1Result<DbRowConcept>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
		const { results } = await db.prepare(sql).bind(stem, sense).all() // note: love-A will still return 2 results, the noun and the verb

		return normalize(results)
	}

	/**
	 * @param {string} filter
	 * @returns {Promise<Concept[]>}
	 */
	async function by_filter(filter) {
		const sql = `
			SELECT *
			FROM Concepts
			WHERE stem like ?
		`

		/** @type {import('@cloudflare/workers-types').D1Result<DbRowConcept>} */
		const { results } = await db.prepare(sql).bind(normalize_wildcards(filter)).all()

		return normalize(results)
	}

	/**
	 * @param {string} possible_wildard – a string that may contain wildcards, e.g., '*' or '#' or '%'
	 * @returns {string} SQL-ready string, i.e., `%` for wildcards
	 */
	function normalize_wildcards(possible_wildard) {
		return possible_wildard.replace(/[*#]/g, '%')
	}

	/**
	 * @param {DbRowConcept[]} matches_from_db
	 * @returns {Concept[]}
	 */
	function normalize(matches_from_db) {
		return matches_from_db.map(transform)
	}
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {Promise<string>}
 */
export async function get_version(db) {
	const sql = `
		SELECT version
		FROM Version
	`

	/** @type {string} https://developers.cloudflare.com/d1/platform/client-api/#await-stmtfirstcolumn */
	return await db.prepare(sql).first('version') || ''
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {(term: string) => Promise<SimplificationHint[]>}
 */
export const get_simplification_hints = db => async term => {
	const sql = `
		SELECT *
		FROM Complex_Terms
		WHERE term = ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<SimplificationHint>} */
	const { results } = await db.prepare(sql).bind(term).all()

	return results.map(normalize)

	/** @param {SimplificationHint} arg */
	function normalize({ term, part_of_speech, pairing, explication }) {
		return { term, part_of_speech, pairing, explication }
	}
}
