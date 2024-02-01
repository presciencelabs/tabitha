import {json} from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({url: {searchParams}, platform}) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	if (!platform?.env.DB_Ontology) {
		console.error(`Ontology database missing from platform arg: ${JSON.stringify(platform)}`)

		return response({term: word, matches: []})
	}

	let matches = await get_matches_from_ontology(platform.env.DB_Ontology)(word)

	if (matches.length > 0) return response({term: word, matches})

	if (!platform?.env.DB_Editor) {
		console.error(`Editor database missing from platform arg: ${JSON.stringify(platform)}`)

		return response({term: word, matches})
	}

	/** @type {string} */
	const stem = await check_inflections(platform.env.DB_Editor)(word)

	if (stem) {
		matches = await get_matches_from_ontology(platform.env.DB_Ontology)(stem)
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
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(lookup_word: string) => Promise<OntologyResult[]>}
 */
function get_matches_from_ontology(db) {
	return lookup

	/**
	 * @param {string} lookup_word
	 * @returns {Promise<OntologyResult[]>}
	 */
	async function lookup(lookup_word) {
		const sql = `
			SELECT id, part_of_speech, stem, level
			FROM Concepts
			WHERE stem LIKE ?
		` // using LIKE here to ensure case-insensitivity, e.g., abram should still match Abram //TODO: should wildcards be guarded against?

		/** @type {import('@cloudflare/workers-types').D1Result<DbRowConcept>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
		const {results} = await db.prepare(sql).bind(lookup_word).all()

		return add_senses(results)
	}
	//TODO: need to DRY this out, it's taken from tabitha-ontology/app/src/lib/server/augmentors.js's augment() OR just start storing senses in the db.
	/**
	 * @param {DbRowConcept[]} matches_from_db
	 * @returns {OntologyResult[]}
	 */
	function add_senses(matches_from_db) {
		const sensed_matches = []
		const sense_tracker = new Map()

		for (const match of matches_from_db.sort(by_id)) {
			const {part_of_speech, stem} = match

			// key must be case-senstive to ensure proper nouns get a new sense, e.g., son and Son
			const key = `${part_of_speech}:${stem}`

			if (!sense_tracker.has(key)) {
				sense_tracker.set(key, 'A')
			}

			const sense = sense_tracker.get(key)

			sensed_matches.push({
				...match,
				sense,
			})

			sense_tracker.set(key, next_sense(sense))
		}

		return sensed_matches
	}

	/**
	 * @param {DbRowConcept} a
	 * @param {DbRowConcept} b
	 *
	 * @returns {number}
	 */
	function by_id(a, b) {
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
	}

	/**
	 * @param {string} sense - a single character in a sequence
	 * @returns {string} - the next character according to ASCII order
	 */
	function next_sense(sense) {
		return String.fromCharCode(sense.charCodeAt(0) + 1)
	}
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
		// not aware of a need to grab multiple rows if the stems are all the same, e.g., love (has both noun and verb), but the stem is the same.
		const sql = `
			SELECT DISTINCT stem
			FROM Inflections
			WHERE inflections LIKE ?
		`

		// prettier-ignore
		return await db.prepare(sql).bind(`%|${possible_inflection}|%`).first('stem') ?? ''
	}
}
