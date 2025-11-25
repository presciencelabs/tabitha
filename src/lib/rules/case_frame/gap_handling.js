import { create_gap_token, TOKEN_TYPE } from '$lib/token'
import { create_skip_filter, create_token_filter } from '../rules_parser'

/**
 * @param {Token[]} tokens
 * @param {string} rule_id
 */
export function fill_same_subject_gap(tokens, rule_id) {
	// place the gap token right after any conjunction or adposition
	const skip_filter = create_skip_filter(['clause_start', { 'category': 'Adposition' }])
	const gap_position = skip_following(tokens, 0, skip_filter)
	const gap_token = create_gap_token(rule_id, 'SAME_SUB', { 'syntax': 'head_np' })
	tokens.splice(gap_position, 0, gap_token)
}

/**
 * @param {Token[]} tokens
 * @param {string} rule_id
 */
export function fill_relative_clause_gap(tokens, rule_id) {
	const gap_position = find_relative_clause_gap(tokens)

	let gap_index = gap_position.splice(0, 1)[0]
	while (gap_position.length) {
		tokens = tokens[gap_index].sub_tokens
		gap_index = gap_position.splice(0, 1)[0]
	}

	const gap_token = create_gap_token(rule_id, 'REL', { 'syntax': 'head_np' })
	tokens.splice(gap_index, 0, gap_token)
}

/**
 * @param {Token[]} tokens
 * @returns {number[]} an array of indexes, where the length indicates the nested level of the found gap
 */
function find_relative_clause_gap(tokens) {
	const head_np_filter = create_token_filter({ 'tag': { 'syntax': 'head_np' } })
	const np_vp_filter = create_skip_filter(['np', 'vp_modifiers'])
	const np_filter = create_skip_filter('np')
	
	const verb_index = tokens.findIndex(create_token_filter({ 'category': 'Verb' }))
	if (verb_index === -1) {
		// if no verb, default to the end of the clause
		return [tokens.length - 1]
	}

	// First check if there's a gap in the subject position
	// eg. John saw the person [who {} left].
	const [found_subj, index_subj] = find_preceding(tokens, verb_index, head_np_filter, np_vp_filter)
	if (!found_subj) {
		return [index_subj + 1]
	}

	// Next check inside a patient clause of 'want' or 'think'
	// eg. John knows the thing [that Peter wants [John to do {}]].
	if (create_token_filter({ 'stem': 'want|think' })(tokens[verb_index])) {
		const patient_clause_filter = create_token_filter({ 'tag': { 'clause_type': 'patient_clause_same_participant|patient_clause_different_participant' } })
		const patient_clause_index = tokens.findIndex(patient_clause_filter)
		if (patient_clause_index !== -1) {
			return [patient_clause_index, ...find_relative_clause_gap(tokens[patient_clause_index].sub_tokens)]
		}
	}

	// Next check if there is a dangling adposition at the end of the clause
	// eg. John knows the problem [that Mary told John about {}]. John has the bag [that John puts money into {}].
	const adposition_filter = create_skip_filter([{ 'category': 'Adposition' }, { 'token': 'to|from|by' }])
	const last_adp_index = tokens.findLastIndex(adposition_filter)
	if (last_adp_index !== -1 && last_adp_index > verb_index) {
		const [found_oblique, index_oblique] = find_following(tokens, last_adp_index, head_np_filter, np_filter)
		if (!found_oblique) {
			return [index_oblique]
		}
	}

	// Next check if there's a dangling adposition right before another adposition
	// eg. John knows the problem [that John talked about {} to Mary].
	let prev_adp_index = -1
	for (let i = 0; i < tokens.length; i++) {
		if (adposition_filter(tokens[i])) {
			if (prev_adp_index === i-1) {
				return [prev_adp_index + 1]
			}
			prev_adp_index = i
		}
	}

	// Next check if there's a gap right after the verb
	// eg. John saw the person [who John told {} about the problem].
	const [found_obj, index_obj] = find_following(tokens, verb_index, head_np_filter, np_vp_filter)
	if (!found_obj) {
		return [index_obj]
	}

	// Default to the end of the clause
	return [tokens.length - 1]
}

/**
 * @param {Token[]} tokens
 * @param {number} start_index
 * @param {TokenFilter} token_filter
 * @param {TokenFilter} skip_filter
 * @returns {[boolean, number]}
 */
function find_preceding(tokens, start_index, token_filter, skip_filter=()=>false) {
	let index = start_index - 1
	while (index >= 0 && !token_filter(tokens[index]) && should_skip(tokens[index], skip_filter)) {
		index -= 1
	}
	return token_filter(tokens[index]) ? [true, index] : [false, index]
}

/**
 * @param {Token[]} tokens
 * @param {number} start_index
 * @param {TokenFilter} skip_filter
 * @returns 
 */
function skip_following(tokens, start_index, skip_filter) {
	let index = start_index + 1
	while (index < tokens.length && should_skip(tokens[index], skip_filter)) {
		index += 1
	}
	return index
}

/**
 * @param {Token[]} tokens
 * @param {number} start_index
 * @param {TokenFilter} token_filter
 * @param {TokenFilter} skip_filter
 * @returns {[boolean, number]}
 */
function find_following(tokens, start_index, token_filter, skip_filter=()=>false) {
	let index = start_index + 1
	while (index < tokens.length && !token_filter(tokens[index]) && should_skip(tokens[index], skip_filter)) {
		index += 1
	}
	return token_filter(tokens[index]) ? [true, index] : [false, index]
}

/**
 * @param {Token} token
 * @param {TokenFilter} skip_filter
 */
function should_skip(token, skip_filter) {
	return skip_filter(token) || token.type === TOKEN_TYPE.NOTE
}