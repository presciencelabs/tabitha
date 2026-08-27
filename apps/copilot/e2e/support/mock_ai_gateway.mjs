// Preloaded via NODE_OPTIONS (see playwright.config.js) before the e2e dev server starts, so
// server-side calls to external APIs that would otherwise make a real (billed, or credential-
// less in CI) network request are intercepted with a canned response instead:
//  - the Vertex AI Gateway (packages/ai's create_ai_client)
//  - Aquifer (brief.ts's SIL Translator's Notes lookup, used by the "brief" mode pipeline)
// Every other origin (sources.tabitha.bible, targets.tabitha.bible) still hits the real network
// as usual.
import { MockAgent, setGlobalDispatcher } from 'undici'

const agent = new MockAgent()
setGlobalDispatcher(agent)

const gateway_pool = agent.get('https://gateway.ai.cloudflare.com')

gateway_pool
	.intercept({ path: path => path.includes(':generateContent'), method: 'POST' })
	.reply(200, ({ body }) => {
		const wire_request = JSON.parse(body)
		const llm_input = JSON.parse(wire_request.contents[0].parts[0].text)

		const notes = (llm_input.triggers ?? []).map(trigger => ({
			meaning: `[e2e mock] meaning for trigger "${trigger.name}"`,
			check: '[e2e mock] check whether the translation carries this meaning.',
			quoted_text: '',
			trigger: { name: trigger.name, node_id: trigger.node_id },
		}))

		const response_text = JSON.stringify({
			notes,
			lwc_text: llm_input.lwc_text ?? llm_input.english_text,
		})

		return {
			candidates: [{
				content: { role: 'model', parts: [{ text: response_text }] },
				finishReason: 'STOP',
			}],
		}
	})
	.persist()

// brief.ts's get_tnn_based_info() looks up a resource id via /resources/search, then fetches
// that resource's plain-text content via /resources/:id.
const aquifer_pool = agent.get('https://api.aquifer.bible')

aquifer_pool
	.intercept({ path: path => path.startsWith('/resources/search'), method: 'GET' })
	.reply(200, { items: [{ id: 1 }] })
	.persist()

aquifer_pool
	.intercept({ path: path => /^\/resources\/\d+$/.test(path), method: 'GET' })
	.reply(200, '[e2e mock] SIL Translator\'s Notes content for this verse.')
	.persist()
