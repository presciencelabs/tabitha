import { TOKEN_TYPE, create_lookup_result, token_has_tag } from './parser/token'
import { REGEXES } from './regexes'
import { create_context_filter, create_token_filter, create_token_modify_action } from './rules/rules_parser'
import { apply_rule_to_tokens } from './rules/rules_processor'

// TODO move whole token pipeline to the server

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_form_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_for_lookup).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_forms))

	return sentences
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_ontology_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_for_lookup).filter(is_lookup_token)

	// TODO only send one api request for all occurrences of a term
	await Promise.all(lookup_tokens.map(check_ontology))
	await Promise.all(lookup_tokens.map(check_how_to))

	result_filter_rules.forEach(({ rule }) => apply_rule_to_tokens(lookup_tokens, rule))

	return sentences
}

/**
 * 
 * @param {Sentence} sentence 
 * @returns {Token[]}
 */
function flatten_for_lookup(sentence) {
	return flatten_tokens(sentence.clause)

	/**
	 * 
	 * @param {Token} token 
	 * @returns {Token[]}
	 */
	function flatten_tokens(token) {
		if (token.type === TOKEN_TYPE.CLAUSE) {
			return token.sub_tokens.flatMap(flatten_tokens)
		} else if (token.complex_pairing) {
			return [token, token.complex_pairing]
		}
		return [token]
	}
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
function is_lookup_token(token) {
	return token.type === TOKEN_TYPE.LOOKUP_WORD
}

/**
 * @param {Token} lookup_token
 */
async function check_forms(lookup_token) {
	// At this point there is always just one lookup term
	const stem = lookup_token.lookup_terms[0]

	const response = await fetch(`/lookup/form?word=${stem}`)

	/** @type {LookupResponse<FormResult>} */
	const results = await response.json()

	lookup_token.lookup_results = results.matches.map(transform_result)

	if (results.matches.length === 0) {
		return
	}

	// The form lookup may have resulted in different stems (eg. saw).
	// So add a lookup term for each unique stem (case-insensitive)
	const unique_stems = new Set(results.matches.map(({ stem }) => stem.toLowerCase()))

	// Add the original lookup stem in case there is a missing form (eg. Adjectives left, following)
	unique_stems.add(stem.toLowerCase())

	// Reattach the sense if present
	lookup_token.lookup_terms = [...unique_stems]

	/**
	 * 
	 * @param {FormResult} form_result 
	 * @returns {LookupResult}
	 */
	function transform_result(form_result) {
		return create_lookup_result(form_result, { form: form_result.form })
	}
}

/**
 * @param {Token} lookup_token
 */
async function check_ontology(lookup_token) {
	const results = (await Promise.all(lookup_token.lookup_terms.map(check_word_in_ontology))).flat()

	const found_results = results.map(transform_result)
	const not_found_results = lookup_token.lookup_results.filter(lookup => !results.some(result => lookups_match(lookup, result)))
	lookup_token.lookup_results = found_results.concat(not_found_results)

	/**
	 * 
	 * @param {string} lookup 
	 * @returns {Promise<OntologyResult[]>}
	 */
	async function check_word_in_ontology(lookup) {
		const response = await fetch(`/lookup/ontology?word=${lookup}`)

		/** @type {LookupResponse<OntologyResult>} */
		const results = await response.json()
		let matches = results.matches

		return matches
	}

	/**
	 * 
	 * @param {OntologyResult} ontology_result 
	 * @returns {LookupResult}
	 */
	function transform_result(ontology_result) {
		const existing_result = lookup_token.lookup_results.find(lookup => lookups_match(lookup, ontology_result))
		const form = existing_result?.form ?? 'stem'
		return create_lookup_result(ontology_result, { form, concept: ontology_result })
	}
}

/**
 * @param {Token} lookup_token
 */
async function check_how_to(lookup_token) {
	// get how-to for the possible stems and for any complex concepts
	const terms = new Set(lookup_token.lookup_terms.map(term => term.toLowerCase()))

	const results = (await Promise.all([...terms].map(check_word_in_how_to))).flat()
	
	for (let how_to_result of results) {
		const existing_result = lookup_token.lookup_results.find(lookup => lookups_match(lookup, how_to_result) && senses_match(lookup, how_to_result))
		if (existing_result) {
			// The sense exists in the ontology and the how-to
			existing_result.how_to.push(how_to_result)

		} else if (how_to_result.sense) {
			// The sense exists in the how-to but not in the ontology, but is planned to be added
			const new_result = create_lookup_result(how_to_result, { how_to: [how_to_result] })
			new_result.concept = {
				id: '0',
				stem: new_result.stem,
				sense: how_to_result.sense,
				part_of_speech: new_result.part_of_speech,
				level: 2,		// since it's in the how-to, it's expected to be complex
				gloss: 'Not yet in Ontology (but should be soon)',
				categorization: '',
			}
			lookup_token.lookup_results.push(new_result)

		} else {
			// The word exists in the how-to but not in the ontology, and may never be
			const new_result = create_lookup_result(how_to_result, { how_to: [how_to_result] })
			lookup_token.lookup_results.push(new_result)
		}
	}

	/**
	 * 
	 * @param {string} lookup 
	 * @returns {Promise<HowToResult[]>}
	 */
	async function check_word_in_how_to(lookup) {
		const response = await fetch(`/lookup/how_to?word=${lookup}`)

		/** @type {LookupResponse<HowToResult>} */
		const results = await response.json()
		let matches = results.matches

		return matches
	}
}

/**
 * 
 * @param {LookupWord} lookup1 
 * @param {LookupWord} lookup2 
 * @returns {boolean}
 */
function lookups_match(lookup1, lookup2) {
	return lookup1.stem === lookup2.stem && lookup1.part_of_speech === lookup2.part_of_speech
}

/**
 * 
 * @param {LookupResult} lookup 
 * @param {HowToResult} how_to_result 
 * @returns {boolean}
 */
function senses_match(lookup, how_to_result) {
	return lookup.concept?.sense === how_to_result.sense
		|| lookup.how_to.some(result => result.sense === how_to_result.sense)
}

/** @type {BuiltInRule[]} */
const result_filter_rules = [
	{
		name: 'Filter lookup results based on upper/lowercase for words not at the start of the sentence.',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !token_has_tag(token, { 'position': 'first_word' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				if (token.token !== 'null') {
					// 'null' is used for some double pairings like 'friends/brothers and null/sisters'.
					// But the concept in the ontology is NULL, so should not be filtered by capitalization
					filter_results_by_capitalization(token)
				}

				if (token.complex_pairing) {
					filter_results_by_capitalization(token.complex_pairing)
				}
			}),
		},
	},
	{
		name: 'Remove lookup results for certain functional Adpositions (up, down, etc)',
		comment: 'While these have an entry in the Ontology, they are only used in the Analyzer with specific Verbs. They should not be recognized as words on their own.',
		rule: {
			trigger: create_token_filter({ 'token': 'to|from|down|off|out|up' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				token.lookup_results = []
			}),
		},
	},
]

/**
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function starts_lowercase(text) {
	return REGEXES.STARTS_LOWERCASE.test(text)
}

/**
 * 
 * @param {Token} token 
 */
function filter_results_by_capitalization(token) {
	token.lookup_results = starts_lowercase(token.token)
		? token.lookup_results.filter(result => starts_lowercase(result.stem))
		: token.lookup_results.filter(result => !starts_lowercase(result.stem))
}