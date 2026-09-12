import { describe, expect, test, vi } from 'vitest'
import { filter_to_phrase, normalize_for_match, search_phrase, to_reference } from './search.server'

type Verse = {
	bookId: string
	chapterId: string
	reference: string
	text: string
}

function verse(overrides: Partial<Verse> = {}): Verse {
	return {
		bookId: 'MAT',
		chapterId: 'MAT.3',
		reference: 'Matt. 3:2',
		text: 'and saying, “Repent, for the kingdom of heaven has come near.”',
		...overrides,
	}
}

function api_response({ verses, total, fums_token = 'tok' }: {
	verses: Verse[]
	total: number
	fums_token?: string
}): Response {
	return new Response(JSON.stringify({
		data: { total, verses },
		meta: { fumsToken: fums_token },
	}))
}

describe('normalize_for_match', () => {
	test.each([
		['Kingdom Of Heaven', 'kingdom of heaven'],
		['kingdom   of\n heaven', 'kingdom of heaven'],
		['  kingdom of heaven  ', 'kingdom of heaven'],
		['God’s word', "god's word"],
		['“Repent”', '"repent"'],
	])('folds %j to %j', (input, expected) => {
		expect(normalize_for_match(input)).toBe(expected)
	})
})

describe('filter_to_phrase', () => {
	// The whole reason the post-filter exists: api.bible matches keywords in any order, so a
	// query for "kingdom of heaven" also returns verses where the words are merely scattered.
	test('keeps contiguous matches and drops scattered keyword hits', () => {
		const contiguous = verse()
		const scattered = verse({
			bookId: 'MRK',
			reference: 'Mark 11:10',
			text: '“Blessed is the coming kingdom of our father David!” “Hosanna in the highest heaven!”',
		})

		const kept = filter_to_phrase({ verses: [contiguous, scattered], phrase: 'kingdom of heaven' })

		expect(kept).toEqual([contiguous])
	})

	test('ignores case, spacing, and curly quotes when matching', () => {
		const verses = [verse({ text: 'the  Kingdom Of Heaven is near' })]

		expect(filter_to_phrase({ verses, phrase: 'kingdom of heaven' })).toHaveLength(1)
	})

	test('returns nothing when the phrase never appears contiguously', () => {
		const verses = [verse({ text: 'heaven and the kingdom' })]

		expect(filter_to_phrase({ verses, phrase: 'kingdom of heaven' })).toEqual([])
	})
})

describe('to_reference', () => {
	test.each([
		['Matt. 3:2', 'MAT', 'Matthew', '3', '2'],
		['Mark 11:10', 'MRK', 'Mark', '11', '10'],
		['1 Cor. 8:3', '1CO', '1 Corinthians', '8', '3'],
		['Song of Solomon 1:1', 'SNG', 'Song of Solomon', '1', '1'],
	])('maps %j to a reference our services resolve', (reference, book_id, book, chapter, verse_number) => {
		expect(to_reference(verse({ bookId: book_id, reference }))).toEqual({
			type: 'Bible',
			id_primary: book,
			id_secondary: chapter,
			id_tertiary: verse_number,
		})
	})

	test('returns null for a book code we have no canonical name for', () => {
		expect(to_reference(verse({ bookId: 'ENO', reference: 'Enoch 1:1' }))).toBeNull()
	})

	test('returns null when no chapter:verse can be read from the reference', () => {
		expect(to_reference(verse({ reference: 'Matthew' }))).toBeNull()
	})
})

describe('search_phrase', () => {
	test('reports projects we have no Bible for rather than failing', async () => {
		const fetch_fn = vi.fn()

		const result = await search_phrase({
			phrase: 'kingdom of heaven',
			project: 'Tagalog',
			api_key: 'key',
			fetch_fn,
		})

		expect(result).toEqual({ kind: 'unsupported_project', project: 'Tagalog' })
		expect(fetch_fn).not.toHaveBeenCalled()
	})

	test('reports unavailable when no api key is configured', async () => {
		const fetch_fn = vi.fn()

		const result = await search_phrase({ phrase: 'x', project: 'English', api_key: '', fetch_fn })

		expect(result).toEqual({ kind: 'unavailable' })
		expect(fetch_fn).not.toHaveBeenCalled()
	})

	test('reports unavailable when the upstream rejects the request', async () => {
		const fetch_fn = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }))

		const result = await search_phrase({ phrase: 'x', project: 'English', api_key: 'bad', fetch_fn })

		expect(result).toEqual({ kind: 'unavailable' })
	})

	test('returns phrase matches with the fums token, marked complete', async () => {
		const fetch_fn = vi.fn().mockResolvedValue(api_response({
			verses: [
				verse(),
				verse({ bookId: 'MRK', reference: 'Mark 11:10', text: 'kingdom of our father David, heaven' }),
			],
			total: 2,
		}))

		const result = await search_phrase({
			phrase: 'kingdom of heaven',
			project: 'English',
			api_key: 'key',
			fetch_fn,
		})

		expect(result).toEqual({
			kind: 'ok',
			complete: true,
			fums_token: 'tok',
			matches: [{
				reference: { type: 'Bible', id_primary: 'Matthew', id_secondary: '3', id_tertiary: '2' },
				text: verse().text,
			}],
		})
	})

	test('sends fuzziness=0 so typo-tolerance cannot loosen an exact phrase hunt', async () => {
		const fetch_fn = vi.fn().mockResolvedValue(api_response({ verses: [], total: 0 }))

		await search_phrase({ phrase: 'kingdom of heaven', project: 'English', api_key: 'key', fetch_fn })

		const [url] = fetch_fn.mock.calls[0]
		expect(url).toContain('fuzziness=0')
		expect(url).toContain('fums-version=3')
	})

	test('stops paging once a short page proves there is nothing more to read', async () => {
		const fetch_fn = vi.fn().mockResolvedValue(api_response({ verses: [verse()], total: 1 }))

		await search_phrase({ phrase: 'kingdom of heaven', project: 'English', api_key: 'key', fetch_fn })

		expect(fetch_fn).toHaveBeenCalledTimes(1)
	})

	test('gives up after the page budget and says the result is incomplete', async () => {
		const full_page = Array.from({ length: 200 }, () => verse())
		// a fresh Response per call -- a body can only be read once
		const fetch_fn = vi.fn().mockImplementation(() => api_response({ verses: full_page, total: 100_000 }))

		const result = await search_phrase({
			phrase: 'kingdom of heaven',
			project: 'English',
			api_key: 'key',
			fetch_fn,
		})

		expect(fetch_fn).toHaveBeenCalledTimes(5)
		expect(result).toMatchObject({ kind: 'ok', complete: false })
	})
})
