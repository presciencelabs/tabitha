/**
 * Matches USFM verse marker tokens (e.g. `\v 14`, `\v  1`).
 *
 * @example
 * Positive: "\\v 1", "\\v 14", "\\v   22"
 * Negative: "\\c 1", "v 14", "verse 1"
 */
export const USFM_VERSE_MARKER_REGEX = /\\v\s+\d+/g

/**
 * Matches linguistic gloss classifier prefixes used in source data dictionaries.
 *
 * @example
 * Positive: "(universal primitive) ", "(LDV) ", "(complex) ", "(complex alternate) ", "(inexplicable) "
 * Negative: "(noun)", "(verb)"
 */
export const GLOSS_CLASSIFIER_REGEX = /\((universal primitive|LDV|complex|complex alternate|inexplicable)\) /g

/**
 * Strips dictionary classifier prefixes from a gloss definition.
 *
 * @param gloss Raw gloss text with potential classifier prefix
 * @returns Clean gloss text
 *
 * @example
 * strip_gloss_classifiers("(universal primitive) to know") -> "to know"
 * strip_gloss_classifiers("(complex) father-in-law") -> "father-in-law"
 */
export function strip_gloss_classifiers(gloss: string): string {
	return gloss.replace(GLOSS_CLASSIFIER_REGEX, '')
}
