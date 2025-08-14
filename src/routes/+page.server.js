import { get_concepts, get_filtered_simplification_hints } from '$lib/server/ontology'

/** @type {import('./$types').PageServerLoad} */
export async function load({ url: { searchParams }, locals: { db_ontology } }) {
	/** @type {ConceptSearchFilter} */
	const search_filter = {
		q: '',
		scope: 'stems',
		category: '',
		...Object.fromEntries(searchParams),
	}

	const matches = await get_concepts(db_ontology)(search_filter)
	const how_to_matches = await get_filtered_simplification_hints(db_ontology)(search_filter)

	// filter out the how-to matches that are not associated with a concept
	const unlinked_how_to_matches = how_to_matches.filter(hint =>
		!matches.some(match => `${match.stem}-${match.sense}` === hint.term && hint.part_of_speech === match.part_of_speech))

	// if a remaining how-to result has a sense, it is pending entry into the ontology and should be treated as a concept
	const pending_results = unlinked_how_to_matches.filter(hint => ends_in_a_sense(hint.term)).map(create_pending_result)
	const how_to_hints = unlinked_how_to_matches.filter(hint => !ends_in_a_sense(hint.term))
	
	// group the remaining entries by term and part_of_speech, so we can show all hints for a given term together
	const how_to_results = [...new Set(how_to_hints.map(hint => `${hint.term}|${hint.part_of_speech}`))].map(create_how_to_result)

	const results = [
		...matches,
		...pending_results,
		...how_to_results,
	]

	return {
		results,
	}

	/**
	 * @param {string} term
	 * @returns {boolean}
	 */
	function ends_in_a_sense(term) {
		const ENDS_IN_A_SENSE = /-[A-Z]$/
		return ENDS_IN_A_SENSE.test(term)
	}

	/**
	 * @param {string} concept_key 
	 * @returns {Concept}
	 */
	function create_how_to_result(concept_key) {
		const [term, part_of_speech] = concept_key.split('|')
		// at this point, this term will not have a sense
		return {
			id: term,
			stem: term,
			sense: '',
			part_of_speech,
			level: 'N/A',
			categorization: '',
			examples: '',
			gloss: 'Not in the Ontology, but has suggestions available',
			brief_gloss: '',
			occurrences: 0,
			categories: [],
			curated_examples: [],
			status: 'absent',
		}
	}

	/**
	 * 
	 * @param {SimplificationHint} hint 
	 * @returns {Concept}
	 */
	function create_pending_result(hint) {
		const matches = hint.term.match(/^(.*)-([A-Z])$/)
		const [stem, sense] = matches ? [matches[1], matches[2]] : [hint.term, 'A']
		return {
			id: hint.term,
			stem,
			sense,
			part_of_speech: hint.part_of_speech,
			level: guess_level(),
			categorization: '',
			examples: '',
			gloss: 'Not yet in the Ontology, but will be added in a future update',
			brief_gloss: '',
			occurrences: 0,
			categories: [],
			curated_examples: [],
			status: 'pending',
		}

		function guess_level() {
			const LEVEL_1_REGEX = /level 1|simple/
			const LEVEL_3_REGEX = /level 3|complex alternate/
			const lower_status = hint.ontology_status.toLowerCase()
			if (LEVEL_1_REGEX.test(lower_status)) {
				return '1'
			} else if (LEVEL_3_REGEX.test(lower_status) || LEVEL_3_REGEX.test(hint.explication.toLowerCase())) {
				return '3'
			} else {
				return '2'
			}
		}
	}
}
