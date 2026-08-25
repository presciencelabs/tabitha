import { AiResponseError, type AiClient } from '@tabitha/ai'
import { expand_token, run_check } from '$lib/server/check'
import { build_repair_instruction, build_system_instruction, type CheckerFeedback } from './prompts'
import { phase_1_response_schema } from './response_schema'

import type { CheckResponse } from '@tabitha/types'
import type { AiAssistResult } from '$lib/types'

const MAX_REPAIR_ATTEMPTS = 1
const EMPTY_CHECK: CheckResponse = { status: 'ok', tokens: [], back_translation: '' }
const STATUS_RANK = { ok: 2, warning: 1, error: 0 }

type Phase1Generation = {
	phase_1: string
	notes?: string[]
}

export async function generate_phase_1({ text, ai }: { text: string, ai: AiClient }): Promise<AiAssistResult> {
	if (!text.trim()) {
		return call_failure('Enter some text to encode.')
	}

	try {
		return await generate_and_check({ text, ai, system_instruction: build_system_instruction(), attempts_left: MAX_REPAIR_ATTEMPTS })
	} catch (error) {
		if (error instanceof AiResponseError) return call_failure(error.message)
		throw error
	}
}

async function generate_and_check({ text, ai, system_instruction, attempts_left }: { text: string, ai: AiClient, system_instruction: string, attempts_left: number }): Promise<AiAssistResult> {
	const generation = await ai.generate_json<Phase1Generation>({
		contents: { english_text: text },
		system_instruction,
		schema: phase_1_response_schema,
	})

	const phase_1 = sanitize(generation.phase_1)
	const notes = generation.notes ?? []
	const check = await run_check(phase_1)
	const result: AiAssistResult = { status: 'ok', phase_1, notes, check }

	if (check.status !== 'error' || attempts_left <= 0) {
		return result
	}

	const repaired = await generate_and_check({
		text,
		ai,
		system_instruction: build_repair_instruction({ previous_attempt: phase_1, feedback: collect_feedback(check) }),
		attempts_left: attempts_left - 1,
	})

	return STATUS_RANK[repaired.check.status] >= STATUS_RANK[result.check.status] ? repaired : result
}

function collect_feedback(check: CheckResponse): CheckerFeedback[] {
	return check.tokens
		.flatMap(expand_token)
		.flatMap(token => token.messages.map(message => ({ token: token.token, label: message.label, message: message.message })))
		.filter(feedback => feedback.label === 'error' || feedback.label === 'warning')
}

function sanitize(text: string): string {
	return text.replaceAll('\n', ' ')
}

function call_failure(message: string): AiAssistResult {
	return { status: 'error', phase_1: '', notes: [], check: EMPTY_CHECK, message }
}
