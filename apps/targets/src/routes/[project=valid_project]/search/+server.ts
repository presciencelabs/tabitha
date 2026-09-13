import { env } from '$env/dynamic/private'
import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
import { parse_search_query, search_text } from '$lib/server/search'
import { run_phrase_mode } from '$lib/server/phrase_mode'
import { MODE } from '$lib/search/modes'
import { json, type RequestHandler } from '@sveltejs/kit'
import type { TargetProject } from '@tabitha/types'

export async function GET({ locals: { db }, params: { project }, url: { searchParams } }: Parameters<RequestHandler>[0]) {
	const q = searchParams.get('q')?.trim()
	if (!q) {
		return json([])
	}

	if (searchParams.get('mode') === MODE.PHRASE) {
		const { hits, complete, notice } = await run_phrase_mode({
			phrase: q,
			// the valid_project route matcher has already checked this against TARGET_PROJECTS
			project: project as TargetProject,
			api_key: env.API_BIBLE_KEY ?? '',
			sources_api_host: PUBLIC_SOURCES_API_HOST,
		})

		// References only, deliberately: the matching verse text is licensed scripture, and the
		// license is conditioned on reporting each view through FUMS -- which we can only do for
		// pages we render ourselves. Callers who need the text fetch it from api.bible under
		// their own license; see apps/targets/README.md.
		let _debug_raw_fetch: unknown
		try {
			const r = await fetch(`${PUBLIC_SOURCES_API_HOST}/lookup/encoded`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify([{ type: 'Bible', id_primary: 'Matthew', id_secondary: '3', id_tertiary: '2' }]),
			})
			_debug_raw_fetch = { status: r.status, ok: r.ok, body: await r.text() }
		} catch (e) {
			_debug_raw_fetch = { thrown: String(e) }
		}

		return json({
			matches: hits.map(({ reference, has_encoding }) => ({ reference, has_encoding })),
			complete,
			notice,
			_debug_sources_api_host: PUBLIC_SOURCES_API_HOST, // TEMP -- remove before merge (issue #85 preview debug)
			_debug_raw_fetch, // TEMP -- remove before merge (issue #85 preview debug)
		})
	}

	const parsed_q = parse_search_query(q)
	const results = await search_text({ db, project: project!, parsed_q })
	return json(results)
}
