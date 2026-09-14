import { BOOK_NAME_BY_USFM_CODE } from '@tabitha/types/patterns'
import type { Reference, TargetProject } from '@tabitha/types'
import type { PhraseMatch, PhraseSearchOutcome } from '$lib/types'

const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1'

/**
 * API.Bible caps `limit` at 200 and silently truncates anything larger rather than erroring,
 * so asking for more just wastes the round trip.
 */
const MAX_PAGE_SIZE = 200

/**
 * How many pages we're willing to walk before giving up and reporting an incomplete result.
 *
 * A common set of words can match thousands of verses; this bounds that cost. The UI tells the
 * user when a search hit the ceiling.
 */
const MAX_PAGES = 5

/**
 * The Bible each target-language project is searched against.
 *
 * Deliberately `Partial`: `Tagalog` is a valid `TargetProject` with no counterpart on our
 * API.Bible account, so the absence is part of the type rather than a runtime surprise.
 */
const BIBLE_ID_BY_PROJECT: Partial<Record<TargetProject, string>> = {
	English: '78a9f6124f344018-01',    // New International Version 2011
	Swahili: '611f8eb23aec8f13-01',    // Biblica Open Kiswahili Contemporary Version (Neno)
	Indonesian: '2dd568eeff29fb3c-02', // Plain Indonesian Translation (62 of 66 books)
}

type ApiBibleVerse = {
	bookId: string
	chapterId: string
	reference: string
	text: string
}

type ApiBibleSearchResponse = {
	data?: {
		total?: number
		verses?: ApiBibleVerse[]
	}
	meta?: {
		fumsToken?: string
	}
}

/**
 * Translates an API.Bible verse into a reference our own services can resolve.
 *
 * Their `bookId` is a USFM code (`MAT`); Sources and Targets both key on the canonical book
 * name (`Matthew`), and `chapterId` arrives as `MAT.3` rather than a bare number.
 */
export function to_reference(verse: ApiBibleVerse): Reference | null {
	const book = BOOK_NAME_BY_USFM_CODE[verse.bookId]

	if (!book) {
		return null
	}

	const [, chapter, verse_number] = verse.reference.match(/(\d+):(\d+)/) ?? []

	if (!chapter || !verse_number) {
		return null
	}

	return {
		type: 'Bible',
		id_primary: book,
		id_secondary: chapter,
		id_tertiary: verse_number,
	}
}

function build_search_url({ bible_id, phrase, offset }: {
	bible_id: string
	phrase: string
	offset: number
}): string {
	const params = new URLSearchParams({
		query: phrase,
		limit: MAX_PAGE_SIZE.toString(),
		offset: offset.toString(),
		// their default is AUTO, which tolerates typos -- we want the words the user actually typed
		fuzziness: '0',
		'fums-version': '3',
	})

	return `${API_BIBLE_BASE}/bibles/${bible_id}/search?${params}`
}

/**
 * Finds the verses containing every word of `phrase` (any order, any distance apart -- whatever
 * API.Bible itself considers a match) in the Bible that backs `project`.
 *
 * Returns a discriminated outcome rather than throwing: a project we have no Bible for, and an
 * upstream that's unreachable or unconfigured, are both ordinary things for the page to explain
 * rather than errors worth an error page.
 */
export async function search_phrase({ phrase, project, api_key, fetch_fn = fetch }: {
	phrase: string
	project: TargetProject
	api_key: string
	fetch_fn?: typeof fetch
}): Promise<PhraseSearchOutcome> {
	const bible_id = BIBLE_ID_BY_PROJECT[project]

	if (!bible_id) {
		return { kind: 'unsupported_project', project }
	}

	if (!api_key) {
		return { kind: 'unavailable' }
	}

	const matches: PhraseMatch[] = []
	let fums_token: string | null = null
	let total = 0
	let pages_read = 0

	while (pages_read < MAX_PAGES) {
		const url = build_search_url({ bible_id, phrase, offset: pages_read * MAX_PAGE_SIZE })
		const response = await fetch_fn(url, { headers: { 'api-key': api_key } })

		if (!response.ok) {
			return { kind: 'unavailable' }
		}

		const body: ApiBibleSearchResponse = await response.json()
		const verses = body.data?.verses ?? []

		fums_token = body.meta?.fumsToken ?? fums_token
		total = body.data?.total ?? 0
		pages_read += 1

		for (const verse of verses) {
			const reference = to_reference(verse)

			if (reference) {
				matches.push({ reference, text: verse.text })
			}
		}

		if (verses.length < MAX_PAGE_SIZE) {
			return { kind: 'ok', matches, complete: true, fums_token }
		}
	}

	return { kind: 'ok', matches, complete: pages_read * MAX_PAGE_SIZE >= total, fums_token }
}
