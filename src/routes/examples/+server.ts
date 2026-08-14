import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
import { json, error } from '@sveltejs/kit'
import { get_examples } from '$lib/server/ontology'
import type { RequestHandler } from './$types'
import type { Example, SourceStatus, StatusApiResult } from '$lib/types'

export const GET: RequestHandler = async ({ url: { searchParams }, locals: { db_ontology } }) => {
	const concept = searchParams.get('concept') ?? error(400, 'Missing "concept" parameter')
	const part_of_speech = searchParams.get('part_of_speech') ?? error(400, 'Missing "part_of_speech" parameter')
	const source = searchParams.get('source') ?? ''

	const examples = await get_examples(db_ontology)(concept, part_of_speech, source)
	const examples_with_status = await fetch_statuses_by_book(examples)

	return response(examples_with_status)

	function response(result: Example[]): Response {
		const THREE_HOUR_CACHE = {
			'cache-control': `max-age=${3 * 60 * 60}`,
		}

		return json(result, {
			headers: THREE_HOUR_CACHE,
		})
	}
}

async function fetch_statuses_by_book(examples: Example[]): Promise<Example[]> {
	const book_refs = Array.from(new Set(examples.map(({ reference }) => reference.id_primary)))

	// Fetch the status for each book to reduce the number of API calls compared to checking each verse.
	// Also rely on caching to reduce the time it takes to fetch the statuses.
	// Without the caching, the whole process can take ~10 seconds.
	const book_statuses: [string, SourceStatus][] = await Promise.all(
		book_refs.map(async book => {
			try {
				const res = await fetch(`${PUBLIC_SOURCES_API_HOST}/lookup/status/Bible/${book}`)
				if (!res.ok) {
					return [book, 'Ready to Translate' as SourceStatus]
				}
				const { status }: StatusApiResult = await res.json()
				return [book, status]
			} catch {
				return [book, 'Ready to Translate' as SourceStatus]
			}
		}),
	)

	const status_map = new Map<string, SourceStatus>(book_statuses)

	return examples.map(example => {
		const book_status = status_map.get(example.reference.id_primary) ?? 'Initial Analysis in Progress'
		return { ...example, book_status }
	})
}
