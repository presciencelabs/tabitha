import { create_embedding_client, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from '@tabitha/ai'

/** Manual, credential-gated integration check -- not part of `bun run test`. Sends one real
 * embedding request through the live gateway using the actual @tabitha/ai client, to confirm the
 * BYOK Vertex route serves `:embedContent` (not only `:generateContent`) at the `global` location
 * before ontology's semantic-search index is backfilled (see ADR 0016). Also prints the similarity
 * of a related and an unrelated pair, as a quick sanity check that the vectors carry meaning. */
async function main() {
	const embedder = create_embedding_client({
		app: 'gateway',
		feature: 'smoke-test',
		gateway: {
			account_id: require_env('CLOUDFLARE_ACCOUNT_ID'),
			token: require_env('AI_GATEWAY_TOKEN'),
			project: require_env('GEMINI_PROJECT_ID'),
			location: require_env('GEMINI_LOCATION'),
		},
	})

	console.log(`Embedding three texts with ${EMBEDDING_MODEL} through the live gateway...`)
	const query = await embedder.embed_text({ purpose: 'query', text: 'joy' })
	const related = await embedder.embed_text({ purpose: 'document', title: 'rejoice', text: 'to feel great happiness' })
	const unrelated = await embedder.embed_text({ purpose: 'document', title: 'plate', text: 'something used to put food on' })

	console.log(`Received ${query.length}-dimension vectors (expected ${EMBEDDING_DIMENSIONS}).`)
	console.log(`similarity("joy", rejoice) = ${cosine_similarity({ a: query, b: related }).toFixed(3)}`)
	console.log(`similarity("joy", plate)   = ${cosine_similarity({ a: query, b: unrelated }).toFixed(3)}`)
	console.log('Success -- the gateway serves embeddings end to end. "rejoice" should score clearly higher than "plate".')
}

function cosine_similarity({ a, b }: { a: number[], b: number[] }): number {
	const dot = a.reduce((sum, value, i) => sum + value * b[i], 0)
	const magnitude = (vector: number[]) => Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
	return dot / (magnitude(a) * magnitude(b))
}

function require_env(key: string): string {
	const value = process.env[key]
	if (!value) throw new Error(`Missing required env var "${key}". Set it in tools/gateway/.env.local.`)
	return value
}

await main()
