import { parse_search_query, search_text } from '$lib/server/search'
import type { PageServerLoad } from './$types'
import type { ReturnTo } from '$lib/types'

export const load: PageServerLoad = async ({ url: { searchParams }, params: { project }, locals: { db } }) => {
	const q = searchParams.get('q')?.trim()
	if (!q) {
		return { results: [], search_terms: [], return_to: undefined }
	}

	const return_to_raw = searchParams.get('return_to')?.trim()
	const return_to: ReturnTo | undefined = return_to_raw ? JSON.parse(decodeURIComponent(return_to_raw)) : undefined

	const parsed_q = parse_search_query(q)
	const results = await search_text(db, project!, parsed_q)
	return {
		results,
		search_terms: parsed_q.or_terms.flatMap(or_term => or_term.and_terms),
		return_to,
	}
}
