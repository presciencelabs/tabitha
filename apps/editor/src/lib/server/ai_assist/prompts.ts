import { CLAUSE_NOTATIONS } from '$lib/parser/clause_notations'
import system_instruction_template from './system_instruction.md?raw'
import repair_instruction_template from './repair_instruction.md?raw'

export type CheckerFeedback = {
	token: string
	label: string
	message: string
}

export function build_system_instruction(): string {
	return system_instruction_template.replace('{{CLAUSE_NOTATIONS}}', () => CLAUSE_NOTATIONS.join(', '))
}

export function build_repair_instruction({ previous_attempt, feedback }: { previous_attempt: string, feedback: CheckerFeedback[] }): string {
	const feedback_lines = feedback.map(({ token, label, message }) => `- [${label}] near "${token}": ${message}`).join('\n')

	return repair_instruction_template
		.replace('{{PREVIOUS_ATTEMPT}}', () => previous_attempt)
		.replace('{{FEEDBACK_LINES}}', () => feedback_lines)
}
