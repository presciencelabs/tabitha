import { get_secondary_ids, get_source_data, get_tertiary_ids } from './read'

/**
 * TODO add and use an 'order' field in the db
 * @type {Record<number, string>}
 */
const bible_books = {
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

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {Reference} reference
 * @returns {Promise<Reference|null>}
 */
export async function get_previous_reference(db, reference) {
	// try decrementing id_tertiary
	let previous = {
		...reference,
		id_tertiary: `${Number(reference.id_tertiary) - 1}`,
	}
	if (previous.id_tertiary !== '0' && await get_source_data(db, previous)) {
		return previous
	}

	// try decrementing id_secondary
	const previous_chapter = `${Number(reference.id_secondary) - 1}`
	if (previous_chapter !== '0') {
		previous = {
			...reference,
			id_secondary: previous_chapter,
			id_tertiary: await get_last_verse(db, reference.id_primary, previous_chapter) || '1',
		}
		if (await get_source_data(db, previous)) {
			return previous
		}
	}

	// try decrementing id_primary (by index)
	const book_index = find_book_index(reference.id_primary)
	if (!book_index) {
		return null
	}

	const previous_book = bible_books[book_index - 1]
	if (!previous_book) {
		return null
	}

	const last_chapter = await get_last_chapter(db, previous_book) || '1'
	const last_verse = await get_last_verse(db, previous_book, last_chapter) || '1'
	previous = {
		...reference,
		id_primary: previous_book,
		id_secondary: last_chapter,
		id_tertiary: last_verse,
	}
	return await get_source_data(db, previous) ? previous : null
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {Reference} reference
 * @returns {Promise<Reference|null>}
 */
export async function get_next_reference(db, reference) {
	// try incrementing id_tertiary
	let next = {
		...reference,
		id_tertiary: `${Number(reference.id_tertiary) + 1}`,
	}
	if (await get_source_data(db, next)) {
		return next
	}

	// try incrementing id_secondary
	next = {
		...reference,
		id_secondary: `${Number(reference.id_secondary) + 1}`,
		id_tertiary: '1',
	}
	if (await get_source_data(db, next)) {
		return next
	}

	// try incrementing id_primary (by index)
	const book_index = find_book_index(reference.id_primary)
	if (!book_index) {
		return null
	}

	const next_book = bible_books[book_index + 1]
	if (!next_book) {
		return null
	}

	next = {
		...reference,
		id_primary: next_book,
		id_secondary: '1',
		id_tertiary: '1',
	}
	return await get_source_data(db, next) ? next : null
}

/**
 * @param {string} book_name
 * @returns {number|undefined}
 */
function find_book_index(book_name) {
	const upper_book_name = book_name.toUpperCase()
	const index_string = Object.entries(bible_books).find(([, name]) => name.toUpperCase() === upper_book_name)?.[0]
	return index_string ? Number(index_string) : undefined
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {string} book_name
 * @returns {Promise<string|null>}
 */
async function get_last_chapter(db, book_name) {
	const secondary_ids = await get_secondary_ids(db, 'Bible', book_name)
	if (secondary_ids.length === 0) {
		return null
	}
	return Math.max(...secondary_ids.map(({ id_secondary }) => Number(id_secondary))).toString()
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 * @param {string} book_name
 * @param {string} chapter
 * @returns {Promise<string|null>}
 */
async function get_last_verse(db, book_name, chapter) {
	const tertiary_ids = await get_tertiary_ids(db, 'Bible', book_name, chapter)
	if (tertiary_ids.length === 0) {
		return null
	}
	return Math.max(...tertiary_ids.map(({ id_tertiary }) => Number(id_tertiary))).toString()
}