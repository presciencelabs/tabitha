import { parse_search_query, search_text } from '$lib/server/search'
import { json, type RequestHandler } from '@sveltejs/kit'

export async function GET({ locals: { db }, params: { project }, url: { searchParams } }: Parameters<RequestHandler>[0]) {
	const q = searchParams.get('q')?.trim()
	if (!q) {
		return json([])
	}

	const parsed_q = parse_search_query(q)
	const results = await search_text({ db, project: project!, parsed_q })
	return json(results)
}
