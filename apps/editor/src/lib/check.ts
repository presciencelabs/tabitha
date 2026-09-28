import type { CheckerAutoFix, EditorCheckResult } from '@tabitha/types'
import { apply_text_insertions } from '$lib/text_insertions'

type CheckedText = {
	text: string
	result: EditorCheckResult
}

async function fetch_check_result({ text, auto_fix }: { text: string; auto_fix: boolean }): Promise<EditorCheckResult> {
	const auto_fix_param = auto_fix ? '&auto_fix=on' : ''
	const response = await fetch(`/check?text=${encodeURIComponent(sanitize_input(text))}${auto_fix_param}`)

	if (!response.ok) {
		return { status: 'error', tokens: [], back_translation: '' }
	}

	return await response.json()
}

// Line breaks become spaces, which keeps every character offset the same as in the author's text
function sanitize_input(text: string): string {
	return text.replaceAll('\n', ' ')
}

export async function check_text(text: string): Promise<CheckedText> {
	const result = await fetch_check_result({ text, auto_fix: true })
	const fixed_text = apply_text_insertions({ text, insertions: result.auto_fixes ?? [] }).text

	return { text: fixed_text, result }
}

// Checks again without auto-fixes, so the removed fix goes back to being only a suggestion
export async function remove_auto_fix({ text, auto_fix }: { text: string; auto_fix: CheckerAutoFix }): Promise<CheckedText> {
	const is_fix_still_in_text = text.slice(auto_fix.start, auto_fix.end) === auto_fix.text
	const reverted_text = is_fix_still_in_text ? text.slice(0, auto_fix.start) + text.slice(auto_fix.end) : text
	const result = await fetch_check_result({ text: reverted_text, auto_fix: false })

	return { text: reverted_text, result }
}
