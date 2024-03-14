import { TOKEN_TYPE, concept_with_sense, split_stem_and_sense } from './parser/token'

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
	const { stem, sense } = split_stem_and_sense(lookup_token.lookup_terms[0])

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
	lookup_token.lookup_terms = sense ? [...unique_stems].map(stem => `${stem}-${sense}`) : [...unique_stems]

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
	const terms = new Set(lookup_token.lookup_terms.map(term => `${term[0].toLowerCase()}${term.substring(1)}`))
	lookup_token.lookup_results
		.map(result => result.concept)
		.filter(concept => concept !== null && [2, 3].includes(concept.level))
		// @ts-ignore null values filtered out above
		.map(concept_with_sense)
		.forEach(term => terms.add(term))

	const results = (await Promise.all([...terms].map(check_word_in_how_to))).flat()
	
	for (let how_to_result of results) {
		const existing_result = lookup_token.lookup_results.find(lookup => lookups_match(lookup, how_to_result) && senses_match(lookup, how_to_result))
		if (existing_result) {
			existing_result.how_to.push(how_to_result)
		} else {
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
 * @param {LookupWord} lookup
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.form='stem'] 
 * @param {OntologyResult?} [other_data.concept=null] 
 * @param {HowToResult[]} [other_data.how_to=[]] 
 */
function create_lookup_result({ stem, part_of_speech }, { form='stem', concept=null, how_to=[] }={}) {
	return {
		stem,
		part_of_speech,
		form,
		concept,
		how_to,
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