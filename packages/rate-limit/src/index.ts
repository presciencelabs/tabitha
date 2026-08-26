import type { Handle } from '@sveltejs/kit'
import type { RateLimit } from '@cloudflare/workers-types'

type EnforceRateLimitOptions = {
	readonly rate_limiter: RateLimit
	readonly key: string
}

export async function enforce_rate_limit({ rate_limiter, key }: EnforceRateLimitOptions): Promise<Response | null> {
	const { success } = await rate_limiter.limit({ key })
	if (success) return null

	return new Response(JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }), {
		status: 429,
		headers: {
			'content-type': 'application/json',
			'retry-after': '60',
		},
	})
}

// Every app wires this binding under the same name, so a narrow structural
// type is enough here without depending on any single app's generated Env.
type RateLimiterEnv = {
	readonly RATE_LIMITER?: RateLimit
}

type CreateRateLimitHandleOptions = {
	readonly skip_path_prefixes?: readonly string[]
	// Local dev and CI run fast, unpaced automated request bursts (a full e2e suite, a dev
	// reloading a page repeatedly) that routinely exceed a threshold meant for real-world abuse.
	// Callers pass this from a public env var, the same way @tabitha/cors's allow_localhost works.
	readonly disabled?: boolean
}

export function create_rate_limit_handle({
	skip_path_prefixes = [],
	disabled = false,
}: CreateRateLimitHandleOptions = {}): Handle {
	return async function rate_limit_handle({ event, resolve }) {
		if (disabled) return resolve(event)

		const { pathname } = new URL(event.request.url)
		if (skip_path_prefixes.some(prefix => pathname.startsWith(prefix))) {
			return resolve(event)
		}

		const platform = event.platform as { env?: RateLimiterEnv } | undefined
		const rate_limiter = platform?.env?.RATE_LIMITER
		if (!rate_limiter) {
			console.error('RATE_LIMITER binding is missing from platform environment.')
			return resolve(event)
		}

		const limited = await enforce_rate_limit({ rate_limiter, key: event.getClientAddress() })
		return limited ?? resolve(event)
	}
}
