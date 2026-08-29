import { env } from '$env/dynamic/private'
import { create_ai_client, check_input_safety, AiResponseError } from '@tabitha/ai'
import { get_all_concepts } from './ontology'
import system_instruction from './semantic_search_prompt.md?raw'
import type { D1Database } from '@cloudflare/workers-types'
import type { Concept } from '$lib/types'

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

// The AI Gateway's prompt-injection guardrail is off gateway-wide (see @tabitha/ai's input_guard
// and ADR 0007), so this is a local, best-effort substitute scoped to the one piece of user text
// here: the search box query. A search term is normally a single word or short phrase, so the cap
// is tight -- no legitimate search needs more than this.
const MAX_SEARCH_TERM_LENGTH = 200

type FindRelatedConceptsOptions = {
	readonly db: D1Database
	readonly search_term: string
}

export async function find_related_concepts({ db, search_term }: FindRelatedConceptsOptions): Promise<Concept[]> {
	const safety_issue = check_input_safety(search_term, {
		max_length: MAX_SEARCH_TERM_LENGTH,
		too_long_message: `Search term is too long (${search_term.length} characters, max ${MAX_SEARCH_TERM_LENGTH}).`,
		suspicious_message: 'Search term looks like it might contain instructions rather than a concept to search for.',
		log_label: 'ontology: semantic-search',
	})
	if (safety_issue) {
		// No related concepts is a normal, unremarkable outcome for a search feature -- fail soft,
		// same as an AiResponseError from the model itself below.
		console.warn(`ontology: semantic-search rejected search term (${search_term.length} chars): ${safety_issue}`)
		return []
	}

	const all_concepts = await get_all_concepts(db)

	// These filters currently result in ~3800 concepts getting sent to the LLM, down from ~6380
	const concept_filters: ((c: Concept) => boolean)[] = [
		// don't bother including whole numbers, they just use up tokens
		// leave decimal numbers though, so things like 'tenth' can relate to '.1'
		c => c.gloss.includes('number') && !!c.stem.match(/^\d/),
		// don't bother including proper names, unless one of the geographical ones like mount-Horeb, city-David, etc.
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

	const ai = create_ai_client({
		app: 'ontology',
		feature: 'semantic-search',
		gateway: {
			account_id: env.CLOUDFLARE_ACCOUNT_ID,
			token: env.AI_GATEWAY_TOKEN,
			project: env.GEMINI_PROJECT_ID,
			location: env.GEMINI_LOCATION,
		},
	})

	let output: string[]
	try {
		output = await ai.generate_json<string[]>({
			contents: input_data,
			system_instruction,
			schema: {
				type: 'array',
				description: 'The list of related concepts.',
				items: {
					type: 'string',
					description: 'The concept identifier.',
				},
			},
			config: {
				// Replaces the old in-memory Map cache, which was per-isolate and largely
				// ineffective on Workers anyway -- the gateway's cache is shared and durable.
				httpOptions: { headers: { 'cf-aig-cache-ttl': String(ONE_WEEK_IN_SECONDS) } },
			},
		})
	} catch (error) {
		// No related concepts is a normal, unremarkable outcome for a search feature -- fail soft.
		if (error instanceof AiResponseError) return []
		throw error
	}

	return output
		.map(key => all_concepts.find(c => key === concept_key(c)))
		.filter((c): c is Concept => c !== undefined)
}

function transform_concept(concept: Concept): { concept: string, gloss: string } {
	return {
		concept: concept_key(concept),
		gloss: transform_gloss(concept),
	}

	function transform_gloss(concept: Concept): string {
		if (concept.status !== 'in ontology') {
			// there is no gloss, but some fields can be used to help the LLM identify the semantics of the word
			const hint = concept.how_to_hints[0]
			if (!hint) return ''

			const { structure, pairing, explication } = hint

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
