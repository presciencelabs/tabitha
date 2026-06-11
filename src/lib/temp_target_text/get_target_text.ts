import { indonesian_titus_1_3, tagalog_titus_1_3 } from './texts'

export function get_target_text(ref: Reference, lwc: string): string | undefined {
	const book_map = target_text_map.get(lwc)?.get(ref.book)
	if (!book_map) {
		return undefined
	}
	return book_map[ref.chapter - 1]?.[ref.verse - 1]
}

const target_text_map: Map<string, Map<string, string[][]>> = new Map([
	['Tagalog', new Map([
		['Titus', tagalog_titus_1_3],
	])],
	['Indonesian', new Map([
		['Titus', indonesian_titus_1_3],
	])],
])
