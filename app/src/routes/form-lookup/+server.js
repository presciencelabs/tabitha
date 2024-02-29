import {json} from '@sveltejs/kit'


/** @type {import('./$types').RequestHandler} */
export async function GET({url: {searchParams}, locals: {db}}) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	const matches = await get_form_matches(db)(word)

	return response({term: word, matches})

	/** @param {LookupResult<FormResult>} result  */
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
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(term: string) => Promise<FormResult[]>}
 */
function get_form_matches(db) {
	return lookup

	/**
	 * @param {string} term
	 * @returns {Promise<FormResult[]>}
	 */
	async function lookup(term) {
		// strip sense from word
		const sense_match = term.match(/^(.+)(-[A-Z])$/)
		const word = sense_match?.[1] ?? term

		const sql = `
			SELECT *
			FROM Inflections
			WHERE inflections LIKE ? OR stem LIKE ?
		`

		/** @type {import('@cloudflare/workers-types').D1Result<DbRowInflection>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
		const {results} = await db.prepare(sql).bind(`%|${word}|%`, word).all()

		return results.map(result => transform_db_result(result, term))
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
			.map((inflection, index) => inflection === term ? index : -1)
			.filter(index => index >= 0)
			.map(index => form_names[index])
			.join('|')

		return {
			stem: result.stem,
			part_of_speech: result.part_of_speech,
			form: matched_forms,
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