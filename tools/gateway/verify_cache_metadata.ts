import { GoogleGenAI } from '@google/genai'
import { gateway_id } from './config'

/** Manual, credential-gated diagnostic -- not part of `pnpm test`. Answers the remaining open
 * question in ADR 0005: does `cf-aig-metadata` participate in Cloudflare's cache key? Sends the
 * same prompt through the gateway three times -- twice with the same `cf-aig-metadata` (a control,
 * to confirm caching works at all) and once with different metadata -- then compares each
 * response's `cf-aig-cache-status` header. Bypasses `@tabitha/ai` deliberately, since that client
 * doesn't surface raw response headers and this diagnostic needs them. */
async function main() {
	const account_id = require_env('CLOUDFLARE_ACCOUNT_ID')
	const gateway_token = require_env('AI_GATEWAY_TOKEN')
	const project = require_env('GEMINI_PROJECT_ID')
	const location = require_env('GEMINI_LOCATION')

	// Unique per run so this starts from a cold cache entry rather than a HIT left over from a
	// previous run.
	const prompt = `cache-metadata-probe-${Date.now()}`

	async function send(feature: string) {
		const genai = new GoogleGenAI({
			apiKey: gateway_token,
			vertexai: true,
			project,
			location,
			httpOptions: {
				baseUrl: `https://gateway.ai.cloudflare.com/v1/${account_id}/${gateway_id}/google-vertex-ai`,
				headers: {
					'cf-aig-authorization': `Bearer ${gateway_token}`,
					'cf-aig-metadata': JSON.stringify({ app: 'gateway', feature }),
				},
			},
		})

		const response = await genai.models.generateContent({
			model: 'gemini-3.5-flash',
			contents: `Reply with exactly one word: ${prompt}`,
			config: { temperature: 0, seed: 42 },
		})

		const headers = response.sdkHttpResponse?.headers ?? {}
		const cache_status = headers['cf-aig-cache-status'] ?? '(no cf-aig-cache-status header found)'
		console.log(`  feature="${feature}" -> cf-aig-cache-status="${cache_status}"`)
	}

	console.log('1. First request (feature "cache-test-a") -- expect a MISS, nothing has seen this prompt yet.')
	await send('cache-test-a')

	console.log('2. Repeat with the SAME metadata (feature "cache-test-a") -- control: expect a HIT if caching works at all.')
	await send('cache-test-a')

	console.log('3. Same prompt, DIFFERENT metadata (feature "cache-test-b") -- the actual question.')
	await send('cache-test-b')

	console.log('4. Repeat feature "cache-test-a" once more, to check for cache-population lag vs. metadata effects.')
	await send('cache-test-a')

	console.log('\nIf step 3 is a HIT, cf-aig-metadata does NOT participate in the cache key (one shared cache entry).')
	console.log('If step 3 is a MISS (while step 2 was a HIT), cf-aig-metadata DOES fragment the cache.')
}

function require_env(key: string): string {
	const value = process.env[key]
	if (!value) throw new Error(`Missing required env var "${key}". Set it in tools/gateway/.env.local.`)
	return value
}

await main()
