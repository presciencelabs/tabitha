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

	const concepts = normalize(results)

	const how_to_results = await get_simplification_hints(db)(concept_filter)
	return merge_how_to_results(concepts, how_to_results)

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
export const get_simplification_hints = db => async filter => {
	if (filter.scope === 'glosses') {
		// a glosses search doesn't make sense for simplification hints
		return []
	}

	const query_builder = build_concept_query(db, 'Complex_Terms')

	if (filter.category && filter.category !== 'all') {
		query_builder.add_filter('part_of_speech = ?', [filter.category])
	}

	const matches = filter.q.match(/^(.*)-([A-Z])$/)
	if (matches) {
		const [, stem, sense] = matches
		query_builder
			.add_filter('stem LIKE ?', [stem])
			.add_filter('sense = ?', [sense])

	} else {
		const normalized_q = normalize_wildcards(filter.q)
		query_builder.add_filter('stem LIKE ?', [normalized_q])

		if (normalized_q === '%') {
			// if the query is just a wildcard, just return hints for existing concepts (ones with a sense),
			// as the user only wants to see what's actually in the ontology
			query_builder.add_filter('sense LIKE "_"', [])
		}
	}

	/** @type {import('@cloudflare/workers-types').D1Result<SimplificationHint>} */
	const { results } = await query_builder.prepare().all()

	return results.map(normalize_results)

	/** @param {SimplificationHint} arg */
	function normalize_results({ stem, sense, part_of_speech, structure, pairing, explication, ontology_status }) {
		return { stem, sense, part_of_speech, structure, pairing, explication, ontology_status }
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
 * @param {string} possible_wildard – a string that may contain wildcards, e.g., '*' or '#' or '%'
 * @returns {string} SQL-ready string, i.e., `%` for wildcards
 */
function normalize_wildcards(possible_wildard) {
	return possible_wildard.replace(/[*#]/g, '%')
}

/**
 * @param {Concept[]} concepts
 * @param {SimplificationHint[]} how_to_results
 * @returns {Concept[]}
 */
function merge_how_to_results(concepts, how_to_results) {
	for (const how_to of how_to_results) {
		const existing_concept = concepts.find(match => concepts_match(match, how_to))
		if (existing_concept) {
			existing_concept.how_to_hints.push(how_to)
		} else if (how_to.sense) {
			// how-to entries with a sense are concepts that haven't been added to the ontology yet
			concepts.push(create_pending_result(how_to))
		} else {
			// how-to entries without a sense will not be added to the ontology
			concepts.push(create_how_to_result(how_to))
		}
	}
	return concepts

	/**
	 * @param {ConceptKey} a
	 * @param {ConceptKey} b
	 */
	function concepts_match(a, b) {
		return a.stem === b.stem && a.sense === b.sense && a.part_of_speech === b.part_of_speech
	}

	/**
	 * @param {SimplificationHint} hint
	 * @returns {Concept}
	 */
	function create_how_to_result(hint) {
		return {
			id: create_concept_key(hint),
			stem: hint.stem,
			sense: hint.sense,
			part_of_speech: hint.part_of_speech,
			level: 'N/A',
			categorization: '',
			examples: '',
			gloss: 'NOT IN THE ONTOLOGY, but suggestions are available',
			brief_gloss: '',
			occurrences: 0,
			categories: [],
			curated_examples: [],
			status: 'absent',
			how_to_hints: [hint],
		}
	}

	/**
	 * 
	 * @param {SimplificationHint} hint 
	 * @returns {Concept}
	 */
	function create_pending_result(hint) {
		return {
			id: create_concept_key(hint),
			stem: hint.stem,
			sense: hint.sense,
			part_of_speech: hint.part_of_speech,
			level: guess_level(),
			categorization: '',
			examples: '',
			gloss: 'Not yet in the Ontology, but will be added in a future update',
			brief_gloss: '',
			occurrences: 0,
			categories: [],
			curated_examples: [],
			status: 'pending',
			how_to_hints: [hint],
		}

		function guess_level() {
			const LEVEL_1_REGEX = /level 1|simple/
			const LEVEL_3_REGEX = /level 3|complex alternate/
			const lower_status = hint.ontology_status.toLowerCase()

			if (LEVEL_3_REGEX.test(lower_status) || LEVEL_3_REGEX.test(hint.explication.toLowerCase())) {
				return '3'
			} else if (LEVEL_1_REGEX.test(lower_status)) {
				return '1'
			} else {
				return '2'
			}
		}
	}

	/**
	 * @param {ConceptKey} concept 
	 * @returns {string}
	 */
	function create_concept_key({ stem, sense, part_of_speech }) {
		return `${stem}-${sense}-${part_of_speech}`
	}
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
