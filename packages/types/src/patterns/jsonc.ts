/**
 * Matches multi-line block comments (/* ... *\/).
 *
 * @example
 * Positive: "/* config *\/", "/*\n * multi-line\n *\/"
 * Negative: "// single line", "url/path"
 */
export const BLOCK_COMMENT_REGEX = /\/\*[\s\S]*?\*\//g

/**
 * Matches single-line comments (// ...).
 *
 * @example
 * Positive: "// comment", "   // indented comment"
 * Negative: "http://localhost", "path/to/file"
 */
export const LINE_COMMENT_REGEX = /\/\/.*$/gm

/**
 * Matches trailing commas before closing curly braces or square brackets.
 *
 * @example
 * Positive: ", }" -> "}", ", ]" -> "]"
 * Negative: ", 'item'"
 */
export const TRAILING_COMMAS_REGEX = /,(\s*[}\]])/g

/**
 * Strips comments and trailing commas from a JSONC (JSON with Comments) string,
 * producing clean, standard JSON ready for `JSON.parse()`.
 *
 * @param jsonc Raw JSON with Comments string
 * @returns Clean standard JSON string
 */
export function strip_jsonc_comments(jsonc: string): string {
	return jsonc
		.replace(BLOCK_COMMENT_REGEX, '')
		.replace(LINE_COMMENT_REGEX, '')
		.replace(TRAILING_COMMAS_REGEX, '$1')
}
