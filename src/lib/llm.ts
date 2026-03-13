import { env } from '$env/dynamic/private'
import { GoogleGenAI } from '@google/genai'
import { trigger_filters, filter_by_encoding, filter_by_language_profile } from '$lib/trigger_filters'

export async function get_llm_cautions(encoding: SourceApiResult, english: string, settings: CopilotSettings): Promise<CopilotLlmOutput> {
	const triggered_issues = trigger_filters
		.filter(filter_by_encoding(encoding.encoding))
		.filter(filter_by_language_profile(settings.language_profile))

	console.log(triggered_issues.map(({ name }) => name))
	const trigger_prompts = triggered_issues.map(({ prompt }) => prompt)

	if (trigger_prompts.length === 0 && (!settings.lwc || settings.lwc === 'English')) {
		return {
			cautions: ['No suggestions for this verse based on the TBTA analysis.'],
		}
	}

	const system_instruction = `You are an expert Bible exegetical adviser who trains mother-tongue translators of the Bible.
			You are an expert in Bible translation. You have PhD in linguistics and ThD from a conservative evangelical seminary.

			You task is to render preselected caution guidance to a mother-tongue translator (MTT) based on the provided tbta_encoding.
			Use only the supplied JSON. Use and obey ALL the provided 'issues' to make your cautions. Do not add new cautions.
			Write ONLY in the requested output_language, and be concise.
			If output_language is not English, translate the english_text and return it.
			Base the cautions ONLY on the tbta_encoding, but if necessary you can use the provided or translated english_text for quoting and reference.
			If you quote the the text in one of your cautions, only quote the parts from the sentence that are relevant to the caution.
			If max_cautions is -1, there is no limit to the number of cautions. Otherwise do not provide more than max_cautions cautions.

			Write according to the specified education level of the MTT according to:
			- grade5 = simple everyday language, no linguistic or grammar terms
			- high_school = simple language, only basic grammar terms
			- undergraduate = moderate linguistic terminology allowed

			Return exactly the schema requested.`

	const llm_input: CopilotLlmInput = {
		output_language: settings.lwc ?? 'English',
		prose_level: settings.mtt_level,
		tbta_encoding: JSON.stringify(encoding),
		english_text: english,
		issues: trigger_prompts,
		max_cautions: settings.max_cautions,
	}

	const ai = new GoogleGenAI({ apiKey: env.API_KEY_GEMINI })

	const response = await ai.models.generateContent({
		model: 'gemini-2.5-flash',
		contents: JSON.stringify(llm_input),
		config: {
			temperature: 0.5,
			seed: 0.0,
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
							'type': 'string',
							'description': 'Caution or note to the MTT.'
						}
					},
					'translated_text': {
						'type': 'string',
						'description': `the english_text translated from English into ${settings.lwc} (if necessary)`
					},
				}
			}
		}
	})

	return response.text?.length ? JSON.parse(response.text) as CopilotLlmOutput : { cautions: [] }
}