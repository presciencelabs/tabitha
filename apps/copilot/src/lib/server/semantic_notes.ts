import { AiResponseError, type AiClient } from '@tabitha/ai'
import system_instruction_template from './semantic_notes_prompt.md?raw'

export async function get_semantic_notes({ llm_input, ai }: { llm_input: CopilotLlmInput, ai: AiClient }): Promise<CopilotLlmOutput> {

	const translate_tbta_text = llm_input.output_language !== 'English' && !llm_input.lwc_text

	if (!translate_tbta_text && llm_input.triggers.length === 0) {
		return { notes: [], lwc_text: llm_input.lwc_text }
	}

	const system_instruction = system_instruction_template.replace('{{TRANSLATE_OR_CITE_INSTRUCTION}}', () => translate_tbta_text
		? 'Translate the english_text into the output_language and return it as the lwc_text. Maintain anything within <<>>. Use that resulting text when citing words or phrases in your notes.'
		: 'When citing words or phrases in your notes, always use the form that appears in the provided lwc_text.')

	let output: CopilotLlmOutput
	try {
		output = await ai.generate_json<CopilotLlmOutput>({
			contents: llm_input,
			system_instruction,
			schema: {
				'type': 'object',
				'properties': {
					'notes': {
						'type': 'array',
						'items': {
							'type': 'object',
							'properties': {
								'meaning': {
									'type': 'string',
									'description': 'The interpreted meaning represented by the trigger, in a single sentence.',
								},
								'check': {
									'type': 'string',
									'description': 'A note to the MTT to consider whether their translation carries the above meaning.',
								},
								'quoted_text': {
									'type': 'string',
									'description': 'The part of the text that relates to the note with at least a few words of context, quoted from the lwc_text.',
								},
								'trigger': {
									'type': 'object',
									'properties': {
										'name': {
											'type': 'string',
											'description': 'The name of the trigger that this note relates to.',
										},
										'node_id': {
											'type': 'string',
											'description': 'The node_id from the trigger that this note relates to.',
										},
									},
									'required': ['name', 'node_id'],
								},
							},
							'required': ['meaning', 'check', 'quoted_text', 'trigger'],
						},
					},
					...translate_tbta_text ? {
						'lwc_text': {
							'type': 'string',
							'description': `the english_text translated from English into ${llm_input.output_language}`,
						},
					} : {},
				},
				'required': ['notes'],
			},
		})
	} catch (error) {
		if (!(error instanceof AiResponseError)) throw error
		output = { notes: [] }
	}

	return {
		notes: output.notes.map(({ meaning, check, quoted_text, trigger }) => ({ meaning: postprocess(meaning), check: postprocess(check), quoted_text, trigger })),
		lwc_text: translate_tbta_text ? output.lwc_text : llm_input.lwc_text,
	}
}

function postprocess(caution: string) {
	// remove senses in case the LLM included it
	return caution?.replaceAll(/ \(\w+-[A-Z]\)/g, '').replaceAll(/-[A-Z](\W)/g, '$1')
}
