import {PUBLIC_ONTOLOGY_API_HOST} from '$env/static/public'
import {json} from '@sveltejs/kit'


/** @type {import('./$types').RequestHandler} */
export async function GET({url: {searchParams}, locals: {db}}) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	let matches = await get_matches_from_ontology(word)

	if (matches.length > 0) return response({term: word, matches})

	/** @type {string} */
	const stem = await check_inflections(db)(word)

	if (stem) {
		matches = await get_matches_from_ontology(stem)
	}

	return response({term: word, matches})

	/** @param {LookupResult<OntologyResult>} result  */
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
 * @param {string} lookup_term
 *
 * @returns {Promise<OntologyResult[]>}
 */
async function get_matches_from_ontology(lookup_term) {
	const response = await fetch(
		`${PUBLIC_ONTOLOGY_API_HOST}/?q=${lookup_term}`
	)

	if (!response.ok) return []

	return response.json()

}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(possible_inflection: string) => Promise<Stem>}
 */
function check_inflections(db) {
	return lookup

	/**
	 * @param {string} possible_inflection
	 * @returns {Promise<Stem>}
	 */
	async function lookup(possible_inflection) {
		// strip sense from word
		const sense_match = possible_inflection.match(/^(.+)(-[A-Z])$/)
		const word = sense_match?.[1] ?? possible_inflection
		const sense = sense_match?.[2] ?? ''

		// not aware of a need to grab multiple rows if the stems are all the same, e.g., love (has both noun and verb), but the stem is the same.
		const sql = `
			SELECT DISTINCT stem
			FROM Inflections
			WHERE inflections LIKE ?
		`

		// prettier-ignore
		const stem = await db.prepare(sql).bind(`%|${word}|%`).first('stem') ?? ''
		return stem ? `${stem}${sense}` : ''
	}
}