import { create_ai_client } from '@tabitha/ai'

/** Manual, credential-gated integration check -- not part of `bun run test`. Sends one real request
 * through the live gateway using the actual @tabitha/ai client, to get a real answer (instead of
 * a guess) to the open questions in ADR 0005: whether the extra `x-goog-api-key` header the SDK
 * sends alongside `cf-aig-authorization` causes Cloudflare's BYOK route to reject the request, and
 * whether the round trip otherwise behaves as expected end to end. */
async function main() {
	const account_id = require_env('CLOUDFLARE_ACCOUNT_ID')
	const gateway_token = require_env('AI_GATEWAY_TOKEN')
	const project = require_env('GEMINI_PROJECT_ID')
	const location = require_env('GEMINI_LOCATION')

	const ai = create_ai_client({
		app: 'gateway',
		feature: 'smoke-test',
		gateway: { account_id, token: gateway_token, project, location },
	})

	console.log('Sending a test request through the live gateway...')
	const text = await ai.generate_text({ contents: 'Reply with exactly one word: pong' })
	console.log(`Response: "${text}"`)
	console.log('Success -- the gateway, BYOK, and the @tabitha/ai client all work together end to end.')
}

function require_env(key: string): string {
	const value = process.env[key]
	if (!value) throw new Error(`Missing required env var "${key}". Set it in tools/gateway/.env.local.`)
	return value
}

await main()
