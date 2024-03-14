import { json } from '@sveltejs/kit'


/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db } }) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	const matches = await get_form_matches(db)(word)

	return response({ term: word, matches })

	/** @param {LookupResponse<FormResult>} result  */
	function response(result) {
		const THREE_HOUR_CACHE = {
			'cache-control': `max-age=${3 * 60 * 60}`,
		}

		return json(result, {
			headers: THREE_HOUR_CACHE,
		})
	}
}

/**
 * This expects no sense attached to the word
 * 
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @returns {(term: LookupTerm) => Promise<FormResult[]>}
 */
function get_form_matches(db) {
	return lookup

	/**
	 * @param {LookupTerm} word
	 * @returns {Promise<FormResult[]>}
	 */
	async function lookup(word) {
		const sql = `
			SELECT *
			FROM Inflections
			WHERE inflections LIKE ? OR stem LIKE ?
		`

		/** @type {import('@cloudflare/workers-types').D1Result<DbRowInflection>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
		const { results } = await db.prepare(sql).bind(`%|${word}|%`, word).all()

		return results.map(result => transform_db_result(result, word))
	}

	/**
	 * 
	 * @param {DbRowInflection} result 
	 * @param {string} term
	 * @returns {FormResult}
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

		return {
			stem: result.stem,
			part_of_speech: result.part_of_speech,
			form: matched_forms || 'stem',
		}
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