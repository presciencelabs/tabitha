import { get_secondary_ids, get_source_data, get_tertiary_ids } from './read'
import { ordered_primary_ids } from './lookups'

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
	const book_index = find_book_index(reference)
	if (!book_index) {
		return null
	}

	const previous_book = ordered_primary_ids[reference.type]?.[book_index - 1]
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
	const book_index = find_book_index(reference)
	if (!book_index) {
		return null
	}

	const next_book = ordered_primary_ids[reference.type]?.[book_index + 1]
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
 * @param {Reference} reference
 * @returns {number|undefined}
 */
function find_book_index(reference) {
	const book_names = ordered_primary_ids[reference.type]
	if (!book_names) {
		return undefined
	}
	const upper_book_name = reference.id_primary.toUpperCase()
	const index_string = Object.entries(book_names).find(([, name]) => name.toUpperCase() === upper_book_name)?.[0]
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