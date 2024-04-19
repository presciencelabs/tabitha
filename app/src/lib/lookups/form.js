import { create_lookup_result } from '$lib/parser/token'

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {(token: Token) => Promise<void>}
 */
export function check_forms(db) {
	return lookup

	/**
	 * @param {Token} token
	 * @returns {Promise<void>}
	 */
	async function lookup(token) {
		// At this point there is always just one lookup term
		// The term is expected to have no sense attached to it
		const term = token.lookup_terms[0]

		const sql = `
			SELECT *
			FROM Inflections
			WHERE inflections LIKE ? OR stem LIKE ?
		`

		/** @type {import('@cloudflare/workers-types').D1Result<DbRowInflection>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
		const { results } = await db.prepare(sql).bind(`%|${term}|%`, term).all()

		const lookup_results = results.map(result => transform_db_result(result, term))

		if (lookup_results.length === 0) {
			return
		}

		// The form lookup may have resulted in different stems (eg. saw).
		// So add a lookup term for each unique stem (case-insensitive)
		const unique_stems = new Set(lookup_results.map(({ stem }) => stem.toLowerCase()))

		// Exclude the original lookup stem as it's handled separately
		unique_stems.delete(term.toLowerCase())

		// Keep the original token-based term as the first lookup term
		token.lookup_terms = [term.toLowerCase(), ...unique_stems]
		token.lookup_results = lookup_results
	}

	/**
	 * 
	 * @param {DbRowInflection} result 
	 * @param {string} term
	 * @returns {LookupResult}
	 */
	function transform_db_result(result, term) {
		/** @type {string[]} */
		// @ts-ignore
		const form_names = result.stem === 'be'
			? BE_FORM_NAMES
			: FORM_NAMES.get(result.part_of_speech)

		const matched_forms = result.inflections.split('|')
			.filter(inflection => inflection !== '')
			.map((inflection, index) => inflection.toLowerCase() === term.toLowerCase() ? index : -1)
			.filter(index => index >= 0)
			.map(index => form_names[index])
			.join('|')

		const form = matched_forms || 'stem'

		return create_lookup_result(result, { form })
	}
}

const FORM_NAMES = new Map([
	['Noun', ['plural']],
	['Verb', ['past', 'past participle', 'participle', 'present']],
	['Adjective', ['comparative', 'superlative']],
	['Adverb', ['comparative', 'superlative']],
])

//|was|been|being|is|am|are|were|
// @ts-ignore
const BE_FORM_NAMES = [...FORM_NAMES.get('Verb'), 'present', 'present', 'past']
