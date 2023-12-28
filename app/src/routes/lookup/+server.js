import {json} from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({url: {searchParams}, platform}) {
	/** @type {LookupTerm} */
	const word = searchParams.get('word') ?? ''

	/** @type {LookupResult<OntologyResult>} */
	const result = {
		term: word,
		matches: [],
	}

	if (!platform?.env.DB_Ontology) {
		console.error(`database missing from platform arg: ${JSON.stringify(platform)}`)

		return json(result)
	}

	result.matches = await get_matches(platform.env.DB_Ontology)(word)

	const THREE_HOUR_CACHE = {
		'cache-control': `max-age=${3 * 60 * 60}`,
	}

	return json(result, {
		headers: THREE_HOUR_CACHE,
	})
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {(lookup_word: string) => Promise<OntologyResult[]>}
 */
function get_matches(db) {
	return async lookup_word => {
		const sql = `
			SELECT id, part_of_speech, stem, level
			FROM Concepts
			WHERE stem = ?
		`

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
