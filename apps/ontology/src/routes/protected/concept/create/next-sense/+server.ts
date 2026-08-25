import { json } from '@sveltejs/kit'
import { get_next_sense } from '$lib/server/changes/concepts'
import type { RequestHandler } from './$types'

export async function GET({ url: { searchParams }, locals: { db_ontology } }: Parameters<RequestHandler>[0]) {
	const stem = searchParams.get('stem') || ''
	const part_of_speech = searchParams.get('part_of_speech') || ''

	const next_sense = await get_next_sense({ db: db_ontology, stem, part_of_speech })

	return json({ next_sense })
}
