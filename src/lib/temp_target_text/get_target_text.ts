import { tagalog_titus_1_2 } from './texts'

export function get_target_text(ref: Reference, lwc: string): string | undefined {
	const book_map = target_text_map.get(lwc)?.get(ref.book)
	if (!book_map) {
		return undefined
	}
	return book_map[ref.chapter - 1]?.[ref.verse - 1]
}

const target_text_map: Map<string, Map<string, string[][]>> = new Map([
	['Tagalog', new Map([
		['Titus', parse_sfm(tagalog_titus_1_2)],
	])],
])

function parse_sfm(sfm_text: string): string[][] {
	const chapters: string[][] = []

	let chapter_verses: string[] = []
	let current_title = ''
	const lines = sfm_text.split('\n').filter(t => t.startsWith('\\c') || t.startsWith('\\v') || t.startsWith('\\s'))

	// Currently this assumes the chapters are in order starting at 1, and same with the verses
	for (const line of lines) {
		if (line.startsWith('\\c')) {
			if (chapter_verses.length) {
				chapters.push(chapter_verses)
			}
			chapter_verses = []

		} else if (line.startsWith('\\s')) {
			current_title = line.slice(3).trim()

		} else if (line.startsWith('\\v')) {
			const verse_text = line.slice(3).trim()
			const all_verse_text = current_title ? `${current_title} ${verse_text}` : verse_text
			chapter_verses.push(all_verse_text)
			current_title = ''
		}
	}
	return chapters
}
