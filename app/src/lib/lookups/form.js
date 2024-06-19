import { create_lookup_result } from '$lib/parser/token'
import { lookups_match } from './common'

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
		add_missing_forms(lookup_results, term)

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

	/**
	 * 
	 * @param {LookupResult[]} results 
	 * @param {string} term 
	 */
	function add_missing_forms(results, term) {
		const missing_form = MISSING_FORMS.get(term.toLowerCase())

		// Some missing forms may become not missing before the code here is updated. Avoid duplicate results in that case.
		if (missing_form && !results.some(result => lookups_match(result, missing_form))) {
			results.push(create_lookup_result(missing_form, missing_form))
		}
	}
}

const FORM_NAMES = new Map([
	['Noun', ['plural']],
	['Verb', ['past', 'past participle', 'participle', 'present']],
	['Adjective', ['comparative', 'superlative']],
	['Adverb', ['comparative', 'superlative']],
])

/** @type {Map<string, { stem: string, part_of_speech: string, form: string }>} */
const MISSING_FORMS = new Map([
	// TODO add more or remove some when we include Analyzer inflections as well
	// see https://github.com/presciencelabs/tabitha-editor/issues/37
	['left', { stem: 'left', part_of_speech: 'Adjective', form: 'stem' }],	// important for disambiguation with 'leave'
	['chiefer', { stem: 'chief', part_of_speech: 'Adjective', form: 'comparative' }],
	['chiefest', { stem: 'chief', part_of_speech: 'Adjective', form: 'superlative' }],
	['am', { stem: 'be', part_of_speech: 'Verb', form: 'present' }],
	['are', { stem: 'be', part_of_speech: 'Verb', form: 'present' }],
	['were', { stem: 'be', part_of_speech: 'Verb', form: 'past' }],
	['goodbye', { stem: 'goodbye', part_of_speech: 'Verb', form: 'stem' }],
	['goodbied', { stem: 'goodbye', part_of_speech: 'Verb', form: 'past|past participle' }],
	['goodbying', { stem: 'goodbye', part_of_speech: 'Verb', form: 'participle' }],
	['goodbyes', { stem: 'goodbye', part_of_speech: 'Verb', form: 'present' }],
	['pity', { stem: 'pity', part_of_speech: 'Verb', form: 'stem' }],
	['pitied', { stem: 'pity', part_of_speech: 'Verb', form: 'past|past participle' }],
	['pitying', { stem: 'pity', part_of_speech: 'Verb', form: 'participle' }],
	['pities', { stem: 'pity', part_of_speech: 'Verb', form: 'present' }],
	['sex', { stem: 'sex', part_of_speech: 'Verb', form: 'stem' }],
	['sexed', { stem: 'sex', part_of_speech: 'Verb', form: 'past|past participle' }],
	['sexing', { stem: 'sex', part_of_speech: 'Verb', form: 'participle' }],
	['sexes', { stem: 'sex', part_of_speech: 'Verb', form: 'present' }],
])

//|was|been|being|is|am|are|were|
// @ts-ignore
const BE_FORM_NAMES = [...FORM_NAMES.get('Verb'), 'present', 'present', 'past']
