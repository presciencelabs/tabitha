// Preloaded via NODE_OPTIONS (see playwright.config.js) before the e2e dev server starts, so
// server-side calls to the Vertex AI Gateway (packages/ai's create_ai_client) are intercepted
// with a canned response instead of making a real, billed call through Cloudflare's gateway.
// Every other origin (sources.tabitha.bible, targets.tabitha.bible, aquifer.bible) still hits
// the real network as usual.
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
