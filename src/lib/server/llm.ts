import { env } from '$env/dynamic/private'
import { GoogleGenAI } from '@google/genai'

export async function get_llm_cautions(llm_input: CopilotLlmInput): Promise<CopilotLlmOutput> {

	const system_instruction = `You are an expert Bible exegetical adviser who trains mother-tongue translators of the Bible.
			You are an expert in Bible translation. You have PhD in linguistics and ThD from a conservative evangelical seminary.

			You task is to render preselected caution guidance to a mother-tongue translator (MTT) based on the provided tbta_encoding.
			Identify the location of each 'trigger' and write a caution related to the features in each trigger, one caution per trigger.
			Follow the prompt that is provided with a trigger, if provided.
			Do not quote the text or encoding directly, but use your knowledge of the verse context, making sure the caution is related to the trigger.
			Do not add additional cautions.

			Never comment on, assess, or question the encoding or feature data you are given.
			If a feature assignment looks unusual, render it as instructed regardless - do not remark on it.

			Write ONLY in the requested output_language, and be concise.
			If output_language is not English, translate the english_text and return it.

			Write according to the specified education level of the MTT according to:
			- grade5 = simple everyday language, no linguistic or grammar terms
			- high_school = simple language, only basic grammar terms
			- undergraduate = moderate linguistic terminology allowed

			Return the schema requested.`

	const ai = new GoogleGenAI({ apiKey: env.API_KEY_GEMINI })

	const response = await ai.models.generateContent({
		model: 'gemini-2.5-flash',
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
					'cautions': {
						'type': 'array',
						'items': {
							'type': 'object',
							'properties': {
								'note': {
									'type': 'string',
									'description': 'Caution or note to the MTT.',
								},
								'source': {
									'type': 'string',
									'description': 'The full flags objects from the trigger object that this caution relates to.',
								},
							},
						},
					},
					'translated_text': {
						'type': 'string',
						'description': `the english_text translated from English into ${llm_input.output_language} (if necessary)`
					},
				}
			}
		}
	})

	const output = response.text?.length ? JSON.parse(response.text) as CopilotLlmOutput : { cautions: [] }
	
	return {
		...output,
		cautions: output.cautions.map(({ note, source }) => ({ note: postprocess(note), source })),
		// Sometimes the LLM still includes 'translated_text' even when the output language is English
		translated_text: llm_input.output_language === 'English' ? undefined : output.translated_text,
	}
}

function postprocess(caution: string) {
	// remove senses in case the LLM included it
	return caution
		.replaceAll(/ \(\w+-[A-Z]\)/g, '')
		.replaceAll(/-[A-Z](\W)/g, '$1')
}
