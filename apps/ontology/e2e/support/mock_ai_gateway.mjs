// Preloaded via NODE_OPTIONS (see playwright.config.js) before the e2e dev server starts, so
// server-side calls to the Vertex AI Gateway (packages/ai's create_ai_client, used by
// semantic_search.ts) are intercepted with a canned response instead of making a real, billed
// call through Cloudflare's gateway. Every other origin still hits the real network as usual.
//
// This patches globalThis.fetch directly rather than using undici's MockAgent/
// setGlobalDispatcher -- see apps/copilot/e2e/support/mock_ai_gateway.mjs for why (that approach
// silently failed to intercept in CI, depending on Node/undici version-specific internals a
// direct fetch override doesn't need).
const original_fetch = globalThis.fetch

globalThis.fetch = async (input, init) => {
	const url = typeof input === 'string' ? input : input.url
	const method = init?.method ?? 'GET'

	if (url.startsWith('https://gateway.ai.cloudflare.com') && url.includes(':generateContent') && method === 'POST') {
		const wire_request = JSON.parse(init.body)
		const llm_input = JSON.parse(wire_request.contents[0].parts[0].text)

		// Echo back the first couple of concepts sent in the request, so find_related_concepts()
		// has real, matchable concept keys to resolve against the actual filtered concept list --
		// no need to know the fixture data's contents in advance.
		const related = (llm_input.concepts ?? []).slice(0, 2).map(concept => concept.concept)

		return new Response(JSON.stringify({
			candidates: [{
				content: { role: 'model', parts: [{ text: JSON.stringify(related) }] },
				finishReason: 'STOP',
			}],
		}), { status: 200, headers: { 'content-type': 'application/json' } })
	}

	return original_fetch(input, init)
}
