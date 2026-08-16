/**
 * Matches YYYY-MM-DD ISO 8601 calendar date strings.
 *
 * @example
 * Positive: "2026-08-16", "1999-12-31"
 * Negative: "2026-8-16", "08/16/2026", "2026-08-16T12:00:00Z"
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Type guard verifying whether a string is a valid `YYYY-MM-DD` ISO date string.
 *
 * @param value String value to validate
 * @returns True if value conforms to YYYY-MM-DD
 */
export function is_iso_date(value: string): boolean {
	return ISO_DATE_REGEX.test(value)
}
