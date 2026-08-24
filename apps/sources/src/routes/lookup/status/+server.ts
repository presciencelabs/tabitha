import { get_verse_statuses } from '$lib/data/status'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { Reference } from '@tabitha/types'

export async function POST({ locals: { db }, request }: Parameters<RequestHandler>[0]) {
	const references: Reference[] = await request.json()

	const results = await get_verse_statuses({ db, references })

	return json(results)
}
