import { PUBLIC_TARGETS_API_HOST } from '$env/static/public'
import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { create_lookup_result } from '$lib/token'

/**
 * @param {Token} lookup_token
 */
export async function check_forms(lookup_token) {
	// At this point there is always just one lookup term
	// The term is expected to have no sense attached to it
	const term = lookup_token.lookup_terms[0]

	const lookup_results = (await get_matches_from_form_lookup(term))
		.filter(result => !result.stem.includes(' '))
		.reduce(transform_results, [])

	add_missing_forms(lookup_results, term)

	if (lookup_results.length === 0) {
		return
	}

	// The form lookup may have resulted in different stems (eg. saw).
	// So add a lookup term for each unique stem (case-insensitive)
	const unique_stems = new Set(lookup_results.map(({ stem }) => stem.toLowerCase()))

	// Exclude the original lookup stem as it's handled separately
	unique_stems.delete(term.toLowerCase())

	// Keep the original token-based term as the first lookup term
	lookup_token.lookup_terms = [term.toLowerCase(), ...unique_stems]
	lookup_token.lookup_results = lookup_results

	/**
	 * Turn all the form results into LookupResults, such that there is one lookup result
	 * for each unique combination of stem and part-of-speech. If there are multiple lexicon entries
	 * with the same stem and part-of-speech (eg. Judah), simply take the id of the first one
	 * and ignore the others. This is what the Analyzer does.
	 * 
	 * @param {LookupResult[]} transformed_results
	 * @param {LexicalFormResult} form_result
	 * @returns {LookupResult[]}
	 */
	function transform_results(transformed_results, form_result) {
		const existing_result = transformed_results.find(LOOKUP_FILTERS.MATCHES_LOOKUP(form_result))

		if (!existing_result) {
			// This is a new lexical entry
			const new_result = create_lookup_result(form_result, { lexicon_id: form_result.id, form: form_result.form })
			transformed_results.push(new_result)

		} else if (existing_result.lexicon_id === form_result.id) {
			// The lexical entry is the same as a previous one, but it has a different form. Include the new form
			existing_result.form = `${existing_result.form}|${form_result.form.toLowerCase()}`

		} else {
			// This is a unique lexical entry with the same stem and part-of-speech as a previous one.
			// But since we only attach to one lexical entry, we can ignore this result. eg. Judah or Gad
		}

		return transformed_results
	}

	/**
	 * 
	 * @param {LookupResult[]} results 
	 * @param {string} term 
	 */
	function add_missing_forms(results, term) {
		const missing_form = MISSING_FORMS.get(term.toLowerCase())

		// Some missing forms may become not missing before the code here is updated. Avoid duplicate results in that case.
		if (missing_form && !results.some(LOOKUP_FILTERS.MATCHES_LOOKUP(missing_form))) {
			results.push(create_lookup_result(missing_form, { form: missing_form.forms }))
		}
	}
}

/**
 * @param {string} lookup_term
 * @returns {Promise<LexicalFormResult[]>}
 */
async function get_matches_from_form_lookup(lookup_term) {
	const response = await fetch(`${PUBLIC_TARGETS_API_HOST}/English/lookup/forms?word=${lookup_term}`)

	if (!response.ok) return []

	return response.json()
}

/** @type {Map<string, { stem: string, part_of_speech: string, forms: string }>} */
const MISSING_FORMS = new Map([
	// TODO add more or remove some when we include Analyzer inflections as well
	// see https://github.com/presciencelabs/tabitha-editor/issues/37
	['chiefer', { stem: 'chief', part_of_speech: 'Adjective', forms: 'comparative' }],
	['chiefest', { stem: 'chief', part_of_speech: 'Adjective', forms: 'superlative' }],
	['am', { stem: 'be', part_of_speech: 'Verb', forms: 'present' }],
	['are', { stem: 'be', part_of_speech: 'Verb', forms: 'present' }],
	['were', { stem: 'be', part_of_speech: 'Verb', forms: 'past' }],
	['goodbye', { stem: 'goodbye', part_of_speech: 'Verb', forms: 'stem' }],
	['goodbied', { stem: 'goodbye', part_of_speech: 'Verb', forms: 'past|perfect' }],
	['goodbying', { stem: 'goodbye', part_of_speech: 'Verb', forms: 'participle' }],
	['goodbyes', { stem: 'goodbye', part_of_speech: 'Verb', forms: 'present' }],
	['pity', { stem: 'pity', part_of_speech: 'Verb', forms: 'stem' }],
	['pitied', { stem: 'pity', part_of_speech: 'Verb', forms: 'past|perfect' }],
	['pitying', { stem: 'pity', part_of_speech: 'Verb', forms: 'participle' }],
	['pities', { stem: 'pity', part_of_speech: 'Verb', forms: 'present' }],
	['sex', { stem: 'sex', part_of_speech: 'Verb', forms: 'stem' }],
	['sexed', { stem: 'sex', part_of_speech: 'Verb', forms: 'past|perfect' }],
	['sexing', { stem: 'sex', part_of_speech: 'Verb', forms: 'participle' }],
	['sexes', { stem: 'sex', part_of_speech: 'Verb', forms: 'present' }],
])
