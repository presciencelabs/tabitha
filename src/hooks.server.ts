import type { ServerInit, Handle } from '@sveltejs/kit'
import { GoogleGenAI } from '@google/genai/node'
import { env } from '$env/dynamic/private'

let ai: GoogleGenAI

export const init: ServerInit = async () => {
	ai = new GoogleGenAI({
		vertexai: true,
		project: env.GEMINI_PROJECT_ID,
		location: env.GEMINI_LOCATION,
		googleAuthOptions: {
			credentials: {
				client_email: env.GEMINI_CLIENT_EMAIL,
				private_key: env.GEMINI_PRIVATE_KEY?.replaceAll(/\\n/g, '\n'),
			}
		}
	})
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.ai = ai
	return resolve(event)
}