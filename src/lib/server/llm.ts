import { env } from '$env/dynamic/private'
import { GoogleGenAI } from '@google/genai/node'

export async function get_llm_notes(llm_input: CopilotLlmInput): Promise<CopilotLlmOutput> {

	const translate_tbta_text = llm_input.output_language !== 'English' && !llm_input.lwc_text

	if (!translate_tbta_text && llm_input.triggers.length === 0) {
		return { notes: [], lwc_text: llm_input.lwc_text }
	}

	const system_instruction = `You are an expert Bible exegetical adviser who trains mother-tongue translators of the Bible.
			You are an expert in Bible translation, and have PhD in linguistics.

			You task is to render preselected meaning notes to a mother-tongue translator (MTT) based on the provided tbta_encoding.
			Identify the location of each 'trigger' and write a note related to the features in each trigger, one note per trigger.
			Each note should have two parts:
				1) a description of the meaning represented by the trigger.
				2) a cautionary note to tell the MTT to consider if the meaning is expressed in their translation.
			Obey the prompt that is attached to a trigger, if provided.
			Do not quote the text, encoding, or triggers directly, but use the surrounding verse context, making sure the caution is related to the trigger.
			DO NOT add additional referents, doctrines, exegetical claims, interpretations, or emphasis that are not represented in the text, encoding, or triggers.
			Do not add additional notes.

			Avoid strong wording like 'make sure that...' or 'clearly' or 'should'.
			Do not suggest any solution, answer, or target-language word or grammatical construction.

			Never comment on, assess, or question the encoding or feature data you are given.
			If a feature assignment looks unusual, render it as instructed regardless - do not remark on it.

			Write ONLY in the requested output_language, and be concise.
			${translate_tbta_text
				? 'Translate the english_text into the output_language and return it as the lwc_text. Maintain anything within <<>>. Use that resulting text when citing words or phrases in your notes.'
				: 'When citing words or phrases in your notes, always use the form that appears in the provided lwc_text.'}

			Write according to the specified education level of the MTT according to:
			- grade5 = simple everyday language, no linguistic or grammar terms
			- high_school = simple language, only basic grammar terms
			- undergraduate = moderate linguistic terminology allowed

			Return the schema requested.`

	const ai = new GoogleGenAI({
		vertexai: true,
		project: env.GEMINI_PROJECT_ID || 'gen-lang-client-0319586327',
		location: env.GEMINI_LOCATION || 'us-central1',
		googleAuthOptions: {
			credentials: {
				client_email: env.GEMINI_CLIENT_EMAIL || 'vertex-copilot-sa@gen-lang-client-0319586327.iam.gserviceaccount.com',
				private_key: env.GEMINI_PRIVATE_KEY?.replaceAll(/\\n/g, '\n'),
			}
		}
	})

	const response = await ai.models.generateContent({
		model: 'gemini-3.5-flash',
		contents: JSON.stringify(llm_input),
		config: {
			temperature: 0.0,
			seed: 42,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0,
			systemInstruction: system_instruction,
			responseMimeType: 'application/json',
			responseJsonSchema: {
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
									'description': 'The part of the text that relates to the note with at least a few words of context, quoted from the lwc_text.'
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
											'description': 'The node_id from the trigger that this note relates to.'
										},
									},
								},
							},
						},
					},
					...(translate_tbta_text ? {
						'lwc_text': {
							'type': 'string',
							'description': `the english_text translated from English into ${llm_input.output_language}`
						}
					} : {}),
				}
			}
		}
	})

	const output = response.text?.length ? JSON.parse(response.text) as CopilotLlmOutput : { notes: [] }
	
	return {
		notes: output.notes.map(({ meaning, check, quoted_text, trigger }) => ({ meaning: postprocess(meaning), check: postprocess(check), quoted_text, trigger })),
		lwc_text: translate_tbta_text ? output.lwc_text : llm_input.lwc_text,
	}
}

function postprocess(caution: string) {
	// remove senses in case the LLM included it
	return caution
		.replaceAll(/ \(\w+-[A-Z]\)/g, '')
		.replaceAll(/-[A-Z](\W)/g, '$1')
}
