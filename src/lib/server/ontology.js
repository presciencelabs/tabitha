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
 * @returns {(concept_filter: ConceptSearchFilter) => Promise<Concept[]>}
 */
export const get_concepts = db => async concept_filter => {
	const query_builder = build_concept_query(db, 'Concepts')

	if (concept_filter.category && concept_filter.category !== 'all') {
		query_builder.add_filter('part_of_speech = ?', [concept_filter.category])
	}

	// senses follow the form word-A, /^(.*)-([A-Z])$/
	const matches = concept_filter.q.match(/^(.*)-([A-Z])$/)
	if (matches) {
		const [, stem, sense] = matches
		query_builder
			.add_filter('stem LIKE ?', [stem])
			.add_filter('sense = ?', [sense])

	} else {
		const normalized_q = normalize_wildcards(concept_filter.q)

		/**
		 * @typedef {[filter: string, params: string[]]} FilterArgs
		 * @type {{ [k: string]: FilterArgs }}
		 */
		const scope_filters = {
			stems: ['stem LIKE ?', [normalized_q]],
			glosses: ['gloss LIKE ?', [`%${normalized_q}%`]],
			all: ['stem LIKE ? OR gloss LIKE ?', [normalized_q, `%${normalized_q}%`]],
		}
		query_builder.add_filter(...scope_filters[concept_filter.scope])
	}

	/** @type {import('@cloudflare/workers-types').D1Result<DbRowConcept>} */
	const { results } = await query_builder.prepare().all()

	return normalize(results)

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
 * case-insensitive match, will accept % as a wildcard as well as sense-specific search, e.g., love-A
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(filter: ConceptSearchFilter) => Promise<SimplificationHint[]>}
 */
export const get_filtered_simplification_hints = db => async filter => {
	const query_builder = build_concept_query(db, 'Complex_Terms')

	if (filter.category && filter.category !== 'all') {
		query_builder.add_filter('part_of_speech = ?', [filter.category])
	}

	const normalized_q = normalize_wildcards(filter.q)
	if (ends_in_a_sense(filter.q)) {
		query_builder.add_filter('term LIKE ?', [filter.q])

	} else if (normalized_q === '%') {
		// if the query is just a wildcard, just return hints for existing concepts (ones with a sense),
		// as the user only wants to see what's actually in the ontology
		query_builder.add_filter('term LIKE ?', [`${normalized_q}-_`])

	} else {
		/**
		 * @typedef {[filter: string, params: string[]]} FilterArgs
		 * @type {{ [k: string]: FilterArgs }}
		 */
		const scope_filters = {
			stems: ['(term LIKE ? OR term LIKE ?)', [normalized_q, `${normalized_q}-_`]],
			glosses: ['explication LIKE ?', [`%${normalized_q}%`]],
			all: ['term LIKE ? OR explication LIKE ?', [normalized_q, `%${normalized_q}%`]],
		}
		query_builder.add_filter(...scope_filters[filter.scope])
	}

	/** @type {import('@cloudflare/workers-types').D1Result<SimplificationHint>} */
	const { results } = await query_builder.prepare().all()

	return results.map(normalize_results)

	/** @param {SimplificationHint} arg */
	function normalize_results({ term, part_of_speech, structure, pairing, explication, ontology_status }) {
		return { term, part_of_speech, structure, pairing, explication, ontology_status }
	}
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {(term: string) => Promise<SimplificationHint[]>} term is case-insensitive
 */
export const get_simplification_hints = db => async term => {
	if (! term) {
		return []
	}

	const sql = `
		SELECT *
		FROM Complex_Terms
		WHERE term LIKE ?
	`

	// normalize wildcards
	const normalized_term = normalize_wildcards(term)

	/**
	 * LIKE creates case-insensitivity, also supports % as a wildcard if explicitly requested
	 *
	 * handles situations like these:
	 * 	- complex_term=accurate
	 * 	- complex_term=Accurate
	 * 	- complex_term=Accura%
	 * 	- complex_term=accuse-A (results in multiple rows)
	 *
	 * but not this:
	 * 	- complex_term=flourish (this must be flourish-A)
	 *
	 * @type {import('@cloudflare/workers-types').D1Result<SimplificationHint>}
	 */
	let { results } = await db.prepare(sql).bind(normalized_term).all()

	if (results.length) {
		return results.map(normalize_results)
	}

	/**
	 * if the term had a sense and there were no matches, no need to try anything else, e.g., love-A
	 */
	if (ends_in_a_sense(term)) {
		return []
	}

	const term_w_any_sense = `${normalized_term}-_` // _ here means a single character wildcard:  https://sqlite.org/lang_expr.html#like
	/**
	 * handles the following cases:
	 *		- complex_term=flourish
	 *		- complex_term=accuse (results in multiple rows for accuse, both accuse-A and accuse-B)
	 *
	 * @type {import('@cloudflare/workers-types').D1Result<SimplificationHint>}
	 */
	const { results: results_second_try } = await db.prepare(sql).bind(term_w_any_sense).all()

	return results_second_try.map(normalize_results)

	/** @param {SimplificationHint} arg */
	function normalize_results({ term, part_of_speech, structure, pairing, explication, ontology_status }) {
		return { term, part_of_speech, structure, pairing, explication, ontology_status }
	}
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {(concept: string, part_of_speech: string, source: string) => Promise<Example[]>} concept is case-sensitive
 */
export const get_examples = db => async (concept, part_of_speech, source) => {
	const sense_match = concept.match(/^(.*)-([A-Z])$/)
	const stem = sense_match ? sense_match[1] : concept
	const sense = sense_match ? sense_match[2] : 'A'

	/**
	 * @type {import('@cloudflare/workers-types').D1Result<DbRowExample>}
	 */
	const { results } = await db.prepare(`
		SELECT *
		FROM Exhaustive_Examples
		WHERE concept_stem = ? AND concept_sense = ? AND concept_part_of_speech = ? AND ref_type LIKE ?
	`).bind(stem, sense, part_of_speech, source.length ? source : '%').all()


	return results.map(normalize_results)

	/** @param {DbRowExample} arg */
	function normalize_results({ ref_type, ref_id_primary, ref_id_secondary, ref_id_tertiary, context_json }) {
		return {
			reference: {
				type: ref_type,
				id_primary: ref_id_primary,
				id_secondary: ref_id_secondary,
				id_tertiary: ref_id_tertiary,
			},
			context: JSON.parse(context_json),
		}
	}
}

/**
 * @param {string} term
 * @returns {boolean}
 */
function ends_in_a_sense(term) {
	const ENDS_IN_A_SENSE = /-[A-Z]$/
	return ENDS_IN_A_SENSE.test(term)
}

/**
 * @param {string} possible_wildard – a string that may contain wildcards, e.g., '*' or '#' or '%'
 * @returns {string} SQL-ready string, i.e., `%` for wildcards
 */
function normalize_wildcards(possible_wildard) {
	return possible_wildard.replace(/[*#]/g, '%')
}

/**
 * @typedef {{
 * 		add_filter: (filter: string, params: string[]) => ConceptQueryBuilder,
 * 		prepare: () => import('@cloudflare/workers-types').D1PreparedStatement
 * }} ConceptQueryBuilder
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {string} table
 * @returns { ConceptQueryBuilder }
 */
function build_concept_query(db, table) {
	/** @type {string[]} */
	const all_filters = []

	/** @type {string[]} */
	const all_params = []

	/**
	 * @param {string} filter
	 * @param {string[]} params
	 * @this {ConceptQueryBuilder}
	 */
	function add_filter(filter, params) {
		all_filters.push(filter)
		all_params.push(...params)
		return this
	}

	/**
	 * @returns {import('@cloudflare/workers-types').D1PreparedStatement}
	 */
	function prepare() {
		const joined_filters = all_filters.map(filter => `(${filter})`).join(' AND ')
		return db.prepare(`
			SELECT *
			FROM ${table}
			WHERE ${joined_filters}`).bind(...all_params)
	}

	return {
		add_filter,
		prepare,
	}
}
