/**
 * Matches trailing slash characters at the end of a URL or path string.
 *
 * @example
 * Positive: "http://localhost:5173/", "/api/v1//"
 * Negative: "http://localhost:5173", "/api/v1/resource"
 */
export const TRAILING_SLASH_REGEX = /\/+$/

/**
 * Strips any trailing slashes from a URL or endpoint string.
 *
 * @param url Base URL or endpoint
 * @returns Clean URL without trailing slashes
 *
 * @example
 * clean_trailing_slash("http://localhost:8788/") -> "http://localhost:8788"
 * clean_trailing_slash("http://localhost:8788") -> "http://localhost:8788"
 */
export function clean_trailing_slash(url: string): string {
	return url.replace(TRAILING_SLASH_REGEX, '')
}
