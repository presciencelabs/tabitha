import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
import { json, error } from '@sveltejs/kit'
import { get_examples } from '$lib/server/ontology'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db_ontology } }) {
	const concept = searchParams.get('concept') ?? error(400, 'Missing "concept" parameter')
	const part_of_speech = searchParams.get('part_of_speech') ?? error(400, 'Missing "part_of_speech" parameter')
	const source = searchParams.get('source') ?? ''

	const examples = await get_examples(db_ontology)(concept, part_of_speech, source)
	const examples_with_status = await fetch_statuses_by_book(examples)

	return response(examples_with_status)

	/** @param {any} result  */
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
 * @param {Example[]} examples 
 * @returns {Promise<Example[]>}
 */
async function fetch_statuses_by_book(examples) {
	const book_refs = Array.from(new Set(examples.map(({ reference }) => reference.id_primary)))

	// Fetch the status for each book to reduce the number of API calls compared to checking each verse.
	// Also rely on caching to reduce the time it takes to fetch the statuses.
	// Without the caching, the whole process can take ~10 seconds.

	/** @type {[string, SourceStatus][]} */
	const book_statuses = await Promise.all(book_refs.map(async book => {
		const response = await fetch(`${PUBLIC_SOURCES_API_HOST}/lookup/status/Bible/${book}`)
		if (!response.ok) {
			// just ignore the status if the API call fails
			return [book, 'Ready to Translate']
		}
		/** @type {StatusApiResult} */
		const { status } = await response.json()
		return [book, status]
	}))

	const status_map = new Map(book_statuses)

	return examples.map(example => {
		const book_status = status_map.get(example.reference.id_primary) ?? 'Initial Analysis in Progress'
		return { ...example, book_status }
	})
}
