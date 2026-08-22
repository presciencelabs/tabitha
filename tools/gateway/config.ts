/** Cloudflare AI Gateway config accepted by the create/update REST endpoints. Field names and
 * enum values are taken from Cloudflare's generated Go client (github.com/cloudflare/cloudflare-go,
 * ai_gateway/aigateway.go), since Cloudflare's public docs pages don't render their field list to
 * a plain HTTP fetch. This intentionally only lists the fields TaBiThA actually sets -- the API
 * accepts several more (dlp, guardrails, stripe, otel, spend_limits) that are left at their
 * Cloudflare-side defaults until there's a reason to set them.
 */
export type DesiredGatewayConfig = {
	cache_ttl: number
	cache_invalidate_on_update: boolean
	collect_logs: boolean
	authentication: boolean
	rate_limiting_interval: number
	rate_limiting_limit: number
	rate_limiting_technique: 'fixed' | 'sliding'
	retry_max_attempts: number
	retry_delay: number
	retry_backoff: 'constant' | 'linear' | 'exponential'
}

/** The gateway id -- also the path segment every app's Universal Endpoint URL routes through. */
export const gateway_id = 'tabitha'

export const desired_gateway_config: DesiredGatewayConfig = {
	// 1 hour; per-request `cf-aig-cache-ttl` can override this per call. See ADR 0005 for the
	// open question on whether `cf-aig-metadata` fragments this cache -- verify before raising it.
	cache_ttl: 3600,
	cache_invalidate_on_update: false,
	collect_logs: true,
	// Required for BYOK: without this, `cf-aig-authorization` isn't enforced, which defeats the
	// point of storing provider credentials gateway-side instead of app-side.
	authentication: true,
	rate_limiting_interval: 60,
	// No real per-app traffic to size this against yet -- generous placeholder, not a considered
	// limit. Retune once usage is measurable. See ADR 0005's rate-limit-isolation revisit trigger:
	// a single shared gateway means one app's burst can throttle another's.
	rate_limiting_limit: 6000,
	rate_limiting_technique: 'sliding',
	retry_max_attempts: 3,
	retry_delay: 500,
	retry_backoff: 'exponential',
}
