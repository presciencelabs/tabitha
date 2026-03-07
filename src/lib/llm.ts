import { API_KEY_GEMINI } from '$env/static/private'
import { GoogleGenAI } from '@google/genai'
import { find_triggered_issues } from '$lib/trigger_filters'

export async function get_llm_suggestions(encoding: SourceApiResult, english: string, settings: CopilotSettings): Promise<CopilotApiResult> {
	const model = 'gemini-2.5-flash'

	const role = `You are an expert Bible exegetical adviser who trains mother-tongue translators of
				the Bible. You are an expert in Bible translation. You have PhD in linguistics and ThD
				from a conservative evangelical seminary.`

	const mtt_info_map = new Map<MttLevel, [string, string]>([
		['grade 5', ['grade 5', 'DO NOT use any linguistic or grammar terms.']],
		['high-school', ['high-school', 'You can use only basic linguistic terms.']],
		['BA', ['B.A. in linguistics', '']],
	])
	const mtt_info = mtt_info_map.get(settings.mtt_level) ?? ['', '']

	const trigger_issues = find_triggered_issues(encoding.encoding, settings.language_profile)
	console.log(trigger_issues.map(({ name }) => name))
	const trigger_prompts = trigger_issues.map(({ prompt }, i) => `${i}: ${prompt}`).join('\n')

	if (trigger_prompts.length === 0) {
		return {
			suggestions: [],
			english_text: english,
		}
	}

	const lwc_prompt = settings.lwc
			? `Translate this English text into ${settings.lwc} and send as the 'lwc_text': ${english}
				ALL your suggestions and EVERY word in them MUST be translated and written in ${settings.lwc}.
				When you quote a part of the TBTA data, you should use the TBTA verse that you translated from English into ${settings.lwc}.
				Do NOT leave anything untranslated into ${settings.lwc}.`
			: `When you quote a part of the TBTA data, you should use the TBTA verse written in English: ${english}`

	const prompt = `Your task is to give guidance to an mother-tongue translator (MTT) based only on the TBTA semantic analysis data provided below.
				Do not use any other knowledge except it. Your suggestions MUST be restricted to the following:
				${trigger_prompts}

				DO NOT give more than ${settings.max_suggestions} suggestions.
				Write your suggestions for an MTT with a ${mtt_info[0]} level education. ${mtt_info[1]}
				Make sure that your suggestions are helpful for MTTs who speak ${settings.lwc ?? 'English'}.
				Make sure that you do NOT use complex terminology from TBTA data.

				Write them as a plain text without points and subpoints. Be concise.
				Carefully check your suggestions for logical errors. Do NOT make logical errors in your suggestions.
				Do not use any asterisks. NEVER use asterisks.
				Do NOT capitalize pronouns unless it is the first word in a sentence. But always capitalize pronoun "I".
				Put your suggestions as proposals/suggestions, not as demands/orders. Do not write "Do that".
				Use a form more fitting for recommendations, not something that an MTT must do.
				Every suggestion and every sentence MUST begin with a capital letter.
				In your suggestions, only quote the parts from the sentence that are relevant to the suggestion.

				${lwc_prompt}

				DO NOT base your suggestions on the English text, but ONLY from the TBTA analysis that is provided below.

				Here is the TBTA analysis, which marks grammatical and lexical information, for you:
				${JSON.stringify(encoding)}

				NEVER EVER write anything from the prompt in your output unless I specifically ask you to do so.`

	const ai = new GoogleGenAI({ apiKey: API_KEY_GEMINI })

	const response = await ai.models.generateContent({
		model,
		contents: prompt,
		config: {
			temperature: 0.0,
			seed: 0.0,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0,
			systemInstruction: role,
			responseMimeType: 'application/json',
			responseJsonSchema: {
				'type': 'object',
				'properties': {
					'suggestions': {
						'type': 'array',
						'items': {
							'type': 'string',
							'description': 'Suggestion or note to the MTT.'
						}
					},
					...(settings.lwc ? {
						'lwc_text': {
							'type': 'string',
							'description': `the TBTA text translated from English into ${settings.lwc}`
						}
					} : {}),
				}
			}
		}
	})

	const result = JSON.parse(response.text || '{"suggestions":[]}') as CopilotApiResult
	result.english_text = english
	return result
}