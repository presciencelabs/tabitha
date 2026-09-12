import { env } from '$env/dynamic/private'
import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
import { parse_search_query, search_text } from '$lib/server/search'
import { run_phrase_mode } from '$lib/server/phrase_mode'
import { MODE } from '$lib/search/modes'
import type { PageServerLoad } from './$types'
import type { ReturnTo } from '$lib/types'
import type { TargetProject } from '@tabitha/types'

export async function load({ url: { searchParams }, params: { project }, locals: { db } }: Parameters<PageServerLoad>[0]) {
	// the valid_project route matcher has already checked this against TARGET_PROJECTS
	const target_project = project as TargetProject

	const return_to_raw = searchParams.get('return_to')?.trim()
	const return_to: ReturnTo | undefined = return_to_raw ? JSON.parse(decodeURIComponent(return_to_raw)) : undefined

	const q = searchParams.get('q')?.trim()
	if (!q) {
		return { results: [], search_terms: [], phrase_results: null, return_to }
	}

	// anything other than an explicit phrase search -- including no mode at all, as on every link
	// written before phrase search existed -- is the original target-text search
	if (searchParams.get('mode') === MODE.PHRASE) {
		const phrase_results = await run_phrase_mode({
			phrase: q,
			project: target_project,
			api_key: env.API_BIBLE_KEY ?? '',
			sources_api_host: PUBLIC_SOURCES_API_HOST,
		})

		return { results: [], search_terms: [q], phrase_results, return_to }
	}

	const parsed_q = parse_search_query(q)
	const results = await search_text({ db, project: target_project, parsed_q })

	return {
		results,
		search_terms: parsed_q.or_terms.flatMap(or_term => or_term.and_terms),
		phrase_results: null,
		return_to,
	}
}
