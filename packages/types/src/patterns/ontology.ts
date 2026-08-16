/**
 * Matches linguistic concept-sense identifiers formatted as `<stem>-<SENSE_LETTER>`.
 *
 * @example
 * Positive: "love-A", "grace-B", "holy_spirit-A"
 * Negative: "love", "love-1", "love-a"
 */
export const CONCEPT_SENSE_REGEX = /^(.*)-([A-Z])$/

/**
 * Matches concept form update keys formatted as `<stem>-<SENSE_LETTER>-<field>`.
 *
 * @example
 * Positive: "love-A-gloss", "grace-B-definition"
 * Negative: "love-A", "love"
 */
export const CONCEPT_UPDATE_KEY_REGEX = /^(.+?)-([A-Z])-(.+)$/

/**
 * Matches UI search wildcard characters (`*` and `#`).
 *
 * @example
 * Positive: "lov*", "gr#ce", "*peace*"
 * Negative: "love", "grace"
 */
export const SQL_WILDCARD_CHAR_REGEX = /[*#]/g

/**
 * Normalizes user search wildcards (`*` and `#`) into SQL `LIKE` wildcard `%`.
 *
 * @param wildcard_str Search query string containing possible `*` or `#`
 * @returns Normalized SQL search pattern
 *
 * @example
 * normalize_wildcards("lov*") -> "lov%"
 * normalize_wildcards("gr#ce") -> "gr%ce"
 */
export function normalize_wildcards(wildcard_str: string): string {
	return wildcard_str.replace(SQL_WILDCARD_CHAR_REGEX, '%')
}

/**
 * Parses a concept-sense key into its constituent stem and uppercase sense letter.
 *
 * @param key Potential concept sense identifier (e.g. "love-A")
 * @returns Parsed object with stem and sense, or null if key does not match
 *
 * @example
 * parse_concept_sense("love-A") -> { stem: "love", sense: "A" }
 * parse_concept_sense("invalid") -> null
 */
export function parse_concept_sense(key: string): { stem: string; sense: string } | null {
	const match = key.trim().match(CONCEPT_SENSE_REGEX)
	if (!match) return null
	return {
		stem: match[1],
		sense: match[2],
	}
}
