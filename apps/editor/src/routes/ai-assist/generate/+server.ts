import { json } from '@sveltejs/kit'
import { create_editor_ai_client } from '$lib/server/ai_assist/client'
import { generate_phase_1 } from '$lib/server/ai_assist'

import type { RequestEvent } from './$types'

export async function POST({ request }: RequestEvent) {
	const { text } = await request.json()

	return json(await generate_phase_1({ text: text ?? '', ai: create_editor_ai_client() }))
}
