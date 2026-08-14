/**
 * Parses a Bible verse reference string into a Reference object.
 * Examples of accepted formats:
 *   "John 3:16"
 *   "Genesis 1:1"
 *   "Psalm 23" -> Psalm 23:1
 *   "1 Corinthians 13:4"
 */
export function parse_reference(input: string): Reference | null {
	const regex = /^([\dA-Za-z\s]+?)\s*(\d+)?(?::(\d+))?$/
	const match = input.trim().match(regex)

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
