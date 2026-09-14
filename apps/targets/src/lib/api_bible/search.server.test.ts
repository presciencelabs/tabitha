import { describe, expect, test, vi } from 'vitest'
import { search_phrase, to_reference } from './search.server'

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

	test('returns every verse api.bible matches, including scattered keyword hits, with the fums token, marked complete', async () => {
		const scattered = verse({
			bookId: 'MRK',
			reference: 'Mark 11:10',
			text: '“Blessed is the coming kingdom of our father David!” “Hosanna in the highest heaven!”',
		})
		const fetch_fn = vi.fn().mockResolvedValue(api_response({
			verses: [verse(), scattered],
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
			matches: [
				{
					reference: { type: 'Bible', id_primary: 'Matthew', id_secondary: '3', id_tertiary: '2' },
					text: verse().text,
				},
				{
					reference: { type: 'Bible', id_primary: 'Mark', id_secondary: '11', id_tertiary: '10' },
					text: scattered.text,
				},
			],
		})
	})

	test('sends fuzziness=0 so typo-tolerant keyword variants stay out of results', async () => {
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
