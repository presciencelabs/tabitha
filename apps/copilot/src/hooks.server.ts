import type { ServerInit, Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { create_ai_client, type AiClient } from '@tabitha/ai'
import { create_cors_handle } from '@tabitha/cors'
import { create_rate_limit_handle } from '@tabitha/rate-limit'
import { PUBLIC_CORS_ALLOW_LOCALHOST, PUBLIC_RATE_LIMIT_DISABLED } from '$env/static/public'
import { env } from '$env/dynamic/private'

let ai: AiClient

export const init: ServerInit = async () => {
	ai = create_ai_client({
		app: 'copilot',
		feature: 'copilot',
		gateway: {
			account_id: env.CLOUDFLARE_ACCOUNT_ID,
			token: env.AI_GATEWAY_TOKEN,
			project: env.GEMINI_PROJECT_ID,
			location: env.GEMINI_LOCATION,
		},
	})
}

const cors_handle = create_cors_handle({ allow_localhost: Boolean(PUBLIC_CORS_ALLOW_LOCALHOST) })

const rate_limit_handle = create_rate_limit_handle({ disabled: Boolean(PUBLIC_RATE_LIMIT_DISABLED) })

const ai_locals_handle: Handle = async function ai_locals_handle({ event, resolve }) {
	event.locals.ai = ai
	return resolve(event)
}

export const handle = sequence(cors_handle, rate_limit_handle, ai_locals_handle)
