import { json, error } from '@sveltejs/kit'
import { get_examples } from '$lib/server/ontology'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams }, locals: { db_ontology } }) {
	const concept = searchParams.get('concept') ?? error(400, 'Missing "concept" parameter')
	const part_of_speech = searchParams.get('part_of_speech') ?? error(400, 'Missing "part_of_speech" parameter')
	const source = searchParams.get('source') ?? ''

	const examples = await get_examples(db_ontology)(concept, part_of_speech, source)

	return response(examples)

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
