// Preloaded via NODE_OPTIONS (see playwright.config.js) before the e2e dev server starts, so
// server-side calls to the Vertex AI Gateway (packages/ai's create_ai_client, used by
// semantic_search.ts) are intercepted with a canned response instead of making a real, billed
// call through Cloudflare's gateway. Every other origin still hits the real network as usual.
import { MockAgent, setGlobalDispatcher } from 'undici'

const agent = new MockAgent()
setGlobalDispatcher(agent)

const gateway_pool = agent.get('https://gateway.ai.cloudflare.com')

gateway_pool
	.intercept({ path: path => path.includes(':generateContent'), method: 'POST' })
	.reply(200, ({ body }) => {
		const wire_request = JSON.parse(body)
		const llm_input = JSON.parse(wire_request.contents[0].parts[0].text)

		// Echo back the first couple of concepts sent in the request, so find_related_concepts()
		// has real, matchable concept keys to resolve against the actual filtered concept list --
		// no need to know the fixture data's contents in advance.
		const related = (llm_input.concepts ?? []).slice(0, 2).map(concept => concept.concept)

		return {
			candidates: [{
				content: { role: 'model', parts: [{ text: JSON.stringify(related) }] },
				finishReason: 'STOP',
			}],
		}
	})
	.persist()
