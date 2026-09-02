import type { Book } from '../reference'

/**
 * The 66 books of the Bible, in canonical order, keyed by book number.
 *
 * Because all keys are integer-like, `Object.keys`/`Object.values` always iterate them in
 * ascending numeric order regardless of literal insertion order (per the ECMAScript spec for
 * integer-index property keys) -- so consumers can rely on `Object.values(BIBLE_BOOKS)` for a
 * book-ordered array without needing to sort it.
 */
export const BIBLE_BOOKS: Book = {
	1: 'Genesis',
	2: 'Exodus',
	3: 'Leviticus',
	4: 'Numbers',
	5: 'Deuteronomy',
	6: 'Joshua',
	7: 'Judges',
	8: 'Ruth',
	9: '1 Samuel',
	10: '2 Samuel',
	11: '1 Kings',
	12: '2 Kings',
	13: '1 Chronicles',
	14: '2 Chronicles',
	15: 'Ezra',
	16: 'Nehemiah',
	17: 'Esther',
	18: 'Job',
	19: 'Psalms',
	20: 'Proverbs',
	21: 'Ecclesiastes',
	22: 'Song of Solomon',
	23: 'Isaiah',
	24: 'Jeremiah',
	25: 'Lamentations',
	26: 'Ezekiel',
	27: 'Daniel',
	28: 'Hosea',
	29: 'Joel',
	30: 'Amos',
	31: 'Obadiah',
	32: 'Jonah',
	33: 'Micah',
	34: 'Nahum',
	35: 'Habakkuk',
	36: 'Zephaniah',
	37: 'Haggai',
	38: 'Zechariah',
	39: 'Malachi',
	40: 'Matthew',
	41: 'Mark',
	42: 'Luke',
	43: 'John',
	44: 'Acts',
	45: 'Romans',
	46: '1 Corinthians',
	47: '2 Corinthians',
	48: 'Galatians',
	49: 'Ephesians',
	50: 'Philippians',
	51: 'Colossians',
	52: '1 Thessalonians',
	53: '2 Thessalonians',
	54: '1 Timothy',
	55: '2 Timothy',
	56: 'Titus',
	57: 'Philemon',
	58: 'Hebrews',
	59: 'James',
	60: '1 Peter',
	61: '2 Peter',
	62: '1 John',
	63: '2 John',
	64: '3 John',
	65: 'Jude',
	66: 'Revelation',
}

const BOOK_ORDER = new Map(Object.values(BIBLE_BOOKS).map((book, index) => [book, index]))

/**
 * Sorts by Bible book order rather than the natural alphabetical order.
 */
export function by_book_order(
	a: { reference: { id_primary: string } },
	b: { reference: { id_primary: string } },
): number {
	return (BOOK_ORDER.get(a.reference.id_primary) ?? -1) - (BOOK_ORDER.get(b.reference.id_primary) ?? -1)
}

/**
 * Matches USFM verse marker tokens (e.g. `\v 14`, `\v  1`).
 *
 * @example
 * Positive: "\\v 1", "\\v 14", "\\v   22"
 * Negative: "\\c 1", "v 14", "verse 1"
 */
export const USFM_VERSE_MARKER_REGEX = /\\v\s+\d+/g
