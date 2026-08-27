import { json } from '@sveltejs/kit'
import type { RequestEvent } from './$types'
import { get_all_verses_in_chapter } from '$lib/server/zoho'

export async function GET({ url: { searchParams } }: RequestEvent) {
	const book = searchParams.get('book') ?? 'Jeremiah'
	const chapter = Number(searchParams.get('chapter') || 1)
	// const verse = Number(searchParams.get('verse') || 1)

	const data = await get_all_verses_in_chapter({ book, chapter })
	return json(data)
}