import { BIBLE_BOOKS } from '@tabitha/types/patterns'
import type { Reference } from '@tabitha/types'

const REFERENCE_REGEX = /^([\dA-Za-z\s]+?)\s*(\d+)?(?::(\d+))?$/

/**
 * Parses a Bible verse reference string into a Reference object.
 * Examples of accepted formats:
 *   "John 3:16"
 *   "Genesis 1:1"
 *   "Psalm 23" -> Psalm 23:1
 *   "1 Corinthians 13:4"
 */
export function parse_reference(input: string): Reference | null {
	const match = input.trim().match(REFERENCE_REGEX)

	if (!match) return null

	const [, id_primary, id_secondary, id_tertiary] = match

	const ref: Reference = {
		type: 'Bible',
		id_primary: id_primary.trim(),
		id_secondary: id_secondary ? id_secondary : '1',
		id_tertiary: id_tertiary ? id_tertiary : '1',
	}

	return ref
}

const KNOWN_BOOKS = new Set(Object.values(BIBLE_BOOKS).map(book => book.toLowerCase()))

/**
 * Whether search-box input should open a verse rather than search Phase 1 text: it names a Bible
 * book, or at least ends in a chapter number (so a near-miss like "Psalm 23" still goes to the
 * reference it was meant as rather than turning into a text search).
 */
export function is_reference_query(input: string): boolean {
	const match = input.trim().match(REFERENCE_REGEX)
	if (!match) return false

	const [, id_primary, id_secondary] = match
	return KNOWN_BOOKS.has(id_primary.trim().toLowerCase()) || id_secondary !== undefined
}
