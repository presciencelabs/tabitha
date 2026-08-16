export const ONE_DAY_IN_SECONDS = 24 * 60 * 60

export interface CacheControlOptions {
	/**
	 * Shared cache (CDN / Cloudflare Edge) max-age in seconds.
	 * Overrides max-age for shared caches.
	 * Defaults to 24 hours (86400s).
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#s-maxage
	 */
	s_maxage_seconds?: number

	/**
	 * Time window in seconds during which a stale cache entry can be served immediately
	 * while a background revalidation request is dispatched.
	 * Defaults to 24 hours (86400s).
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate
	 * @see https://datatracker.ietf.org/doc/html/rfc5861
	 */
	stale_while_revalidate_seconds?: number

	/**
	 * Local browser max-age in seconds.
	 * Defaults to 0 so the browser always verifies with Edge CDN / Worker
	 * rather than locking stale data into local disk cache.
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#max-age
	 */
	browser_max_age_seconds?: number
}

/**
 * Returns a standard JSON Response configured with modern HTTP Stale-While-Revalidate (SWR)
 * and Edge CDN caching headers.
 *
 * Directives applied:
 * - `public`: Allows intermediate shared caches (e.g. Cloudflare Edge) to cache responses.
 * - `max-age=0`: Prevents the browser from caching data permanently on disk, ensuring users
 *   receive fresh data immediately after a deployment.
 * - `s-maxage=86400`: Instructs Cloudflare Edge CDN to cache the response for up to 24 hours.
 * - `stale-while-revalidate=86400`: Allows Cloudflare Edge or compatible clients to return
 *   the cached copy instantly (0ms) while asynchronously refreshing stale entries in the background.
 * - `must-revalidate`: Ensures stale data is never used once the SWR window expires.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 */
export function cached_json<T>(
	data: T,
	options: CacheControlOptions | number = {},
): Response {
	const opts: CacheControlOptions =
		typeof options === 'number'
			? { s_maxage_seconds: options }
			: options

	const s_maxage = opts.s_maxage_seconds ?? ONE_DAY_IN_SECONDS
	const swr = opts.stale_while_revalidate_seconds ?? ONE_DAY_IN_SECONDS
	const browser_max_age = opts.browser_max_age_seconds ?? 0

	const cache_control = `public, max-age=${browser_max_age}, s-maxage=${s_maxage}, stale-while-revalidate=${swr}, must-revalidate`

	return new Response(JSON.stringify(data), {
		headers: {
			'content-type': 'application/json',
			'cache-control': cache_control,
		},
	})
}
