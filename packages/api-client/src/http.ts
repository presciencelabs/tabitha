import { clean_trailing_slash } from '@tabitha/types'

export type ClientOptions = {
	base_url: string
	fetch?: typeof fetch
	/** Enable or disable client caching (defaults to false). */
	cache?: boolean
}

export type HttpClient = {
	get: <T>(path: string, init?: RequestInit) => Promise<T | null>
	post: <T>(path: string, body?: unknown, init?: RequestInit) => Promise<T | null>
}

const DEFAULT_CACHE_TAG = '1'

/**
 * Creates a centralized HTTP client for API consumers.
 *
 * Automatically handles:
 * - Base URL normalization (trailing slash trimming)
 * - Declarative caching (`cache: true`) via transparent GET query parameter injection
 * - JSON body serialization and Content-Type headers on POST requests
 * - MIME-type aware response dispatching (JSON, text, streams, binary)
 * - Built-in error checking (`!res.ok -> null`)
 */
export function create_http_client(options: ClientOptions): HttpClient {
	const { base_url, cache = false } = options
	const clean_base = clean_trailing_slash(base_url)
	const get_fetch = () => options.fetch ?? globalThis.fetch

	function build_url(path: string, is_get = false): string {
		const normalized_path = path.startsWith('/') ? path : `/${path}`
		const full_url = `${clean_base}${normalized_path}`
		if (!cache || !is_get) return full_url

		const separator = full_url.includes('?') ? '&' : '?'
		return `${full_url}${separator}v=${DEFAULT_CACHE_TAG}`
	}

	async function parse_response<T>(res: Response): Promise<T | null> {
		if (!res.ok) return null

		const content_type = res.headers?.get?.('content-type') ?? ''

		// 1. Streaming (SSE / streams)
		if (content_type.includes('text/event-stream')) {
			return res.body as T
		}

		// 2. Binary / Downloads (file downloads, audio, zip)
		if (
			content_type.includes('application/octet-stream') ||
			content_type.includes('application/zip') ||
			content_type.includes('audio/')
		) {
			return (await res.arrayBuffer()) as T
		}

		// 3. Plain text / Markdown / CSV
		if (
			content_type.includes('text/plain') ||
			content_type.includes('text/markdown') ||
			content_type.includes('text/csv')
		) {
			return (await res.text()) as T
		}

		// 4. Default: JSON
		try {
			return (await res.json()) as T
		} catch {
			return null
		}
	}

	return {
		async get<T>(path: string, init?: RequestInit): Promise<T | null> {
			const url = build_url(path, true)
			const res = await (init ? get_fetch()(url, { ...init, method: 'GET' }) : get_fetch()(url))
			return parse_response<T>(res)
		},

		async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T | null> {
			const url = build_url(path, false)
			const res = await get_fetch()(url, {
				...init,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...init?.headers,
				},
				body: body !== undefined ? JSON.stringify(body) : undefined,
			})
			return parse_response<T>(res)
		},
	}
}
