import { env } from '$env/dynamic/private'
import { GoogleGenAI } from '@google/genai'
import { get_all_concepts } from './ontology'
import type { D1Database } from '@cloudflare/workers-types'

export async function find_related_concepts(db: D1Database, search_term: string): Promise<Concept[]> {
	const all_concepts = await get_all_concepts(db)

	// check the cache
	const cached_results = get_from_cache(search_term)
	if (cached_results) {
		return cached_results.map(key => all_concepts.find(c => key === concept_key(c))!)
	}

	// These filters currently result in ~3800 concepts getting sent to the LLM, down from ~6380
	const concept_filters: ((c: Concept) => boolean)[] = [
		// don't bother including whole numbers, they just use up tokens
		// leave decimal numbers though, so things like 'tenth' can relate to '.1'
		c => c.gloss.includes('number') && !!c.stem.match(/^\d/),
		// don't bother including proper names, unless one of the geographical ones like mount-Horeb, city-David, etc. Unsure about this one
		c => c.gloss.startsWith('(proper name)') /*&& !c.stem.match(/^(?:sea-|mount-|valley-|river-|desert-|city-|cave-|feast-|gate-)/i)*/,
		// don't include dates and times other than '12PM' so it can relate to 'noon'
		c => !!c.stem.match(/\d(?:BC|AD|PM|AM)$/) && c.stem !== '12PM',
		// don't include concepts that are going to be deleted
		c => c.gloss.includes('DELETE'),
		// don't include the concepts that are exactly the search term (handled separately and would be redundant)
		// TODO figure out how to include these again in order to take better advantage of implicit caching
		//   See https://ai.google.dev/gemini-api/docs/caching?lang=node#implicit-caching
		c => c.stem === search_term,
	]

	// Note that currently the input is about 73800 tokens, and sometimes triggers 20000-50000 tokens of implicit cache
	const input_data = {
		concepts: all_concepts.filter(c => !concept_filters.some(f => f(c))).map(transform_concept),
		search_term,
	}

	const system_instruction = `
		You are provided a 'search_term' and a list of 'concepts', which are entries within a semantic ontology.
		Your job is to search for and output the 'concepts' that are MOST semantically related to the search_term.
		Provide between 0 and 10 concepts.
		Return the list of related concepts according to the requested schema, with the MOST related concepts first.`

	const ai = new GoogleGenAI({ apiKey: env.API_KEY_GEMINI })

	const response = await ai.models.generateContent({
		model: 'gemini-2.5-flash',
		contents: JSON.stringify(input_data),
		config: {
			temperature: 0.0,
			seed: 42,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0,
			systemInstruction: system_instruction,
			responseMimeType: 'application/json',
			// https://ai.google.dev/gemini-api/docs/structured-output?example=recipe#json_schema_support
			responseJsonSchema: {
				'type': 'array',
				'description': 'The list of related concepts.',
				'items': {
					'type': 'string',
					'description': 'The concept identifier.',
				},
			},
		},
	})

	const output = response.text?.length ? JSON.parse(response.text) as string[] : []
	if (output.length) {
		set_cache(search_term, output)
	}

	return output.map(key => all_concepts.find(c => key === concept_key(c))!)
}

function transform_concept(concept: Concept): { concept: string, gloss: string } {
	return {
		concept: concept_key(concept),
		gloss: transform_gloss(concept),
	}

	function transform_gloss(concept: Concept): string {
		if (concept.status !== 'in ontology') {
			// there is no gloss, but some fields can be used to help the LLM identify the semantics of the word
			const { structure, pairing, explication } = concept.how_to_hints[0]
			return `${structure} - ${pairing} - ${explication}`.trim()
		} else {
			// remove anything within parentheses
			return concept.gloss.replaceAll(/\(.+?\)/g, '').trim()
		}
	}
}

function concept_key({ stem, sense, part_of_speech }: Concept): string {
	return `${stem}-${sense}-${part_of_speech}`
}

const related_concept_cache: Map<string, [string[], Date]> = new Map()

function get_from_cache(search_term: string): string[] | undefined {
	const cached_value = related_concept_cache.get(search_term)
	if (!cached_value) {
		return undefined
	}

	const [results, timestamp] = cached_value

	const a_week_ago = new Date()
	a_week_ago.setDate(a_week_ago.getDate() - 7)
	if (timestamp < a_week_ago) {
		return undefined
	}

	return [...results]
}

function set_cache(search_term: string, results: string[]) {
	related_concept_cache.set(search_term, [[...results], new Date()])
}