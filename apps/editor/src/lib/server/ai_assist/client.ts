import { env } from '$env/dynamic/private'
import { create_ai_client, type AiClient } from '@tabitha/ai'

export function create_editor_ai_client(): AiClient {
	return create_ai_client({
		app: 'editor',
		feature: 'ai-assist',
		gateway: {
			account_id: env.CLOUDFLARE_ACCOUNT_ID,
			token: env.AI_GATEWAY_TOKEN,
			project: env.GEMINI_PROJECT_ID,
			location: env.GEMINI_LOCATION,
		},
	})
}
