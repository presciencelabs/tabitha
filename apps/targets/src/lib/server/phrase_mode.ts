import { create_sources_client } from '@tabitha/api-client'
import { search_phrase } from '$lib/api_bible/search.server'
import type { PhraseMatch, PhraseSearchResults } from '$lib/types'
import type { SourceVerseStatusResult, TargetProject } from '@tabitha/types'

/**
 * Attaches each match to whether Sources actually holds a semantic encoding for that verse.
 *
 * Kept pure and separate from the request below because of how the two are paired: by position,
 * not by the reference Sources echoes back, since `StatusRequestReference` is typed loosely
 * enough to have no `id_tertiary` at all. That makes ordering load-bearing across an HTTP
 * boundary, which is worth being able to test directly. A short or missing response leaves the
 * remaining verses marked as having no encoding -- the safe way to be wrong here, since it
 * offers less rather than promising a structure that isn't there.
 */
export function attach_encoding_availability({ matches, statuses }: {
	matches: PhraseMatch[]
	statuses: SourceVerseStatusResult[] | null
}): PhraseSearchResults['hits'] {
	return matches.map(({ reference, text }, index) => ({
		reference,
		text,
		has_encoding: statuses?.[index]?.has_encoding ?? false,
	}))
}

/**
 * Runs the phrase mode: find the verses containing a phrase in the project's scripture, then say
 * which of them we can actually show a structure for.
 *
 * Sources answers a whole batch of references in one request, so the second half stays a single
 * round trip however many verses the phrase turned up.
 */
export async function run_phrase_mode({ phrase, project, api_key, sources_api_host }: {
	phrase: string
	project: TargetProject
	api_key: string
	sources_api_host: string
}): Promise<PhraseSearchResults> {
	const outcome = await search_phrase({ phrase, project, api_key })

	if (outcome.kind !== 'ok') {
		return { hits: [], complete: true, fums_token: null, notice: outcome.kind }
	}

	if (!outcome.matches.length) {
		return { hits: [], complete: outcome.complete, fums_token: outcome.fums_token, notice: null }
	}

	const sources = create_sources_client({ base_url: sources_api_host, cache: true })
	const statuses = await sources.get_verse_statuses(outcome.matches.map(match => match.reference))

	return {
		hits: attach_encoding_availability({ matches: outcome.matches, statuses }),
		complete: outcome.complete,
		fums_token: outcome.fums_token,
		notice: null,
	}
}
