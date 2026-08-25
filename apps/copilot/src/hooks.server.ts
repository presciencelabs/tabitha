import type { ServerInit, Handle } from '@sveltejs/kit'
import { create_ai_client, type AiClient } from '@tabitha/ai'
import { env } from '$env/dynamic/private'

let ai: AiClient

export const init: ServerInit = async () => {
	ai = create_ai_client({
		app: 'copilot',
		feature: 'copilot',
		gateway: {
			account_id: env.CLOUDFLARE_ACCOUNT_ID,
			gateway_name: 'tabitha',
			token: env.AI_GATEWAY_TOKEN,
			project: env.GEMINI_PROJECT_ID,
			location: env.GEMINI_LOCATION,
		},
	})
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.ai = ai
	return resolve(event)
}
