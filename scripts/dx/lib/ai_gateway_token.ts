import { build_gateway_url, type AiGatewayConfig } from '@tabitha/ai'

export type GatewayTokenStatus = 'valid' | 'rejected' | 'unexpected'

// An empty `{}` body is enough to tell a good token from a bad one without running the model:
// the gateway rejects a bad token itself (401) before forwarding anything, while a good token
// gets forwarded and Vertex answers 400 for the missing `contents` -- which also proves the
// gateway's stored Vertex credentials and project routing work end to end.
const STATUS_BY_HTTP_CODE: Record<number, GatewayTokenStatus> = {
	400: 'valid',
	401: 'rejected',
	403: 'rejected',
}

export const classify_gateway_response = (http_code: number): GatewayTokenStatus =>
	STATUS_BY_HTTP_CODE[http_code] ?? 'unexpected'

export async function probe_gateway_token(gateway: AiGatewayConfig): Promise<{ status: GatewayTokenStatus, http_code: number }> {
	const response = await fetch(build_gateway_url(gateway), {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'cf-aig-authorization': `Bearer ${gateway.token}`,
		},
		body: '{}',
		signal: AbortSignal.timeout(10_000),
	})

	return { status: classify_gateway_response(response.status), http_code: response.status }
}
