import {TOKEN_TYPE} from './parser/token'
import {REGEXES} from './regexes'

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

	await Promise.all(lookup_tokens.map(check_ontology))

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
	const stem_match = lookup_token.lookup_terms[0].match(REGEXES.EXTRACT_STEM_AND_SENSE)
	const stem = stem_match?.[1] ?? ''
	const sense = stem_match?.[2]

	const response = await fetch(`/form-lookup?word=${stem}`)

	/** @type {LookupResult<FormResult>} */
	const results = await response.json()

	lookup_token.form_results = results.matches

	if (results.matches.length === 0) {
		return
	}

	// The form lookup may have resulted in different stems (eg. saw).
	// So add a lookup term for each unique stem (case-insensitive)
	const unique_stems = new Set(results.matches.map(({stem}) => stem.toLowerCase()))

	// Add the original lookup stem in case there is a missing form (eg. Adjectives left, following)
	unique_stems.add(stem.toLowerCase())

	// Reattach the sense if present
	lookup_token.lookup_terms = sense ? [...unique_stems].map(stem => `${stem}-${sense}`) : [...unique_stems]
}

/**
 * @param {Token} lookup_token
 */
async function check_ontology(lookup_token) {
	const results = await Promise.all(lookup_token.lookup_terms.map(check_word_in_ontology))
	lookup_token.lookup_results = results.flat()

	/**
	 * 
	 * @param {string} lookup 
	 * @returns {Promise<OntologyResult[]>}
	 */
	async function check_word_in_ontology(lookup) {
		const response = await fetch(`/ontology-lookup?word=${lookup}`)

		/** @type {LookupResult<OntologyResult>} */
		const results = await response.json()
		let matches = results.matches

		return matches
	}
}