export const phase_1_response_schema = {
	type: 'object',
	properties: {
		phase_1: {
			type: 'string',
			description: 'The Phase 1 encoding of the submitted English text, one line, no surrounding commentary or markdown fences.',
		},
		notes: {
			type: 'array',
			items: { type: 'string' },
			description: 'Short explanations of non-obvious encoding decisions (sense choices, added referents, clause splits). Omit obvious ones.',
		},
	},
	required: ['phase_1'],
}
