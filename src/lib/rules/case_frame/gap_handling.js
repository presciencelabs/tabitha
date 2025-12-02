import { add_tag_to_token, create_gap_token, TOKEN_TYPE } from '$lib/token'
import { create_context_filter, create_skip_filter, create_token_filter, simple_rule_action } from '../rules_parser'

/**
 * @param {Token[]} tokens
 * @param {string} rule_id
 */
export function fill_same_subject_gap(tokens, rule_id) {
	// place the gap token right after any conjunction or adposition
	const skip_filter = create_skip_filter(['clause_start', { 'category': 'Adposition' }])
	const gap_index = skip_following(tokens, 0, skip_filter)
	insert_gap_noun_token('SAME_SUB', tokens, [gap_index], rule_id)
}

/**
 * @param {Token[]} tokens
 * @param {string} rule_id
 */
export function fill_relative_clause_gap(tokens, rule_id) {
	const gap_indexes = find_clause_gap(tokens)
	insert_gap_noun_token('REL', tokens, gap_indexes, rule_id)
}

/**
 * @param {Token[]} tokens
 * @param {number} verb_index
 * @param {string} rule_id
 */
export function fill_interrogative_gap(tokens, verb_index, rule_id) {
	const head_np = { 'tag': { 'syntax': 'head_np' }, 'skip': ['np_modifiers', 'vp_modifiers'] }

	/** @type {TokenRuleCore[]} */
	const gap_rules = [
		{
			trigger: create_token_filter({ 'stem': 'be' }),
			context: create_context_filter({
				'precededby': head_np,
				'followedby': head_np,
			}),
			action: simple_rule_action(({ tokens, rule_id }) => {
				const gap_index = find_clause_end_for_gap(tokens)
				insert_gap_noun_token('INTV_N', tokens, [gap_index], rule_id)
			})
		},
		{
			trigger: () => true,
			context: create_context_filter({ 
				'precededby': [head_np, { 'tag': 'auxiliary', 'skip': 'np_modifiers' }, head_np],
			}),
			action: simple_rule_action(({ tokens, rule_id }) => {
				const gap_indexes = find_clause_gap(tokens)
				insert_gap_noun_token('INTV_N', tokens, gap_indexes, rule_id)
			})
		},
	]

	const verb_token = tokens[verb_index]
	const gap_rule = gap_rules.find(rule => rule.trigger(verb_token) && rule.context(tokens, verb_index).success)
	if (gap_rule) {
		const verb_trigger_context = {
			trigger_token: verb_token,
			trigger_index: verb_index,
			tokens,
			context_indexes: [],
			subtoken_indexes: [],
			rule_id,
		}
		gap_rule.action(verb_trigger_context)
	}
}

/**
 * 
 * @param {Token[]} tokens
 * @param {number} be_index
 * @param {string} rule_id
 */
export function handle_be_interrogative(tokens, be_index, rule_id) {
	// eg. 'Who(A) is happy?' 'Who(A) is at the store(S)?' 'Who(A) is like our God(S)?' (don't move)
	// eg. 'Who(?) is that man(A) GAP(S)?' 'Which book(?) is John's book(A) GAP(S)?' 'What(?) is that book(A) about GAP(S)?'
	// eg. 'Is John(A) that man's father(S)?' 'Is that book(A) John's book(S)?'
	// eg. 'Is John(A) happy?' 'Is John(A) at the store(S)?' 'Is that book(A) about John(S)?'
	// move the verb and leave behind a gap token ONLY if 'be' is followed directly by a head noun
	const context_filter = create_context_filter({ 'followedby': { 'tag': { 'syntax': 'head_np' }, 'skip': ['np_modifiers', 'vp_modifiers'] } })
	const context_result = context_filter(tokens, be_index)
	if (!context_result.success) {
		return
	}

	// Insert a 'gap' verb after the noun phrase that directly follows it
	// This solution isn't perfect because there may be a norman genitive ('of X').
	// 		We can't check for that because there's no way at this point to identify where that np would end.
	// 		It may be followed directly by another NP ('Is the brother of Paul John?') or an AdjP ('Is the brother of Paul happy?').
	// This solution will work in most cases, and since a genitive is not marked as 'head_np', it shouldn't affect the case frame checking either.
	const head_np_index = context_result.context_indexes[0]
	const np_end_skip_filter = create_skip_filter({ 'tag': { 'clause_type': 'relative_clause' } })
	const vp_gap_index = skip_following(tokens, head_np_index, np_end_skip_filter)
	insert_ghosted_gap_token('INTV_V', tokens, be_index, vp_gap_index, rule_id)
}

/**
 * @param {Token[]} tokens 
 * @returns {number}
 */
function find_clause_end_for_gap(tokens) {
	/** @type {TokenFilter} */
	const IS_PUNCTUATION = token => token.type === TOKEN_TYPE.PUNCTUATION
	// starting from the end, find the first index that isn't punctuation
	return find_preceding(tokens, tokens.length, token => !IS_PUNCTUATION(token), IS_PUNCTUATION)[1] + 1
}

/**
 * @param {Token[]} tokens
 * @returns {number[]} an array of indexes, where the length indicates the nested level of the found gap
 */
function find_clause_gap(tokens) {
	const head_np_filter = create_token_filter({ 'tag': { 'syntax': 'head_np' } })
	const np_vp_filter = create_skip_filter(['np', 'vp_modifiers'])
	const np_filter = create_skip_filter('np')
	
	const verb_index = tokens.findIndex(create_token_filter({ 'category': 'Verb' }))
	if (verb_index === -1) {
		// if no verb, default to the end of the clause
		return [find_clause_end_for_gap(tokens)]
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
			return [patient_clause_index, ...find_clause_gap(tokens[patient_clause_index].sub_tokens)]
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
	return [find_clause_end_for_gap(tokens)]
}

/**
 * @param {string} gap_label 
 * @param {Token[]} tokens 
 * @param {number[]} gap_indexes 
 * @param {string} rule_id 
 */
function insert_gap_noun_token(gap_label, tokens, gap_indexes, rule_id) {
	let gap_index = gap_indexes.splice(0, 1)[0]
	while (gap_indexes.length) {
		tokens = tokens[gap_index].sub_tokens
		gap_index = gap_indexes.splice(0, 1)[0]
	}

	const gap_token = create_gap_token(rule_id, gap_label, { 'syntax': 'head_np' })
	tokens.splice(gap_index, 0, gap_token)
}

/**
 * @param {string} gap_label
 * @param {Token[]} tokens
 * @param {number} ghost_index
 * @param {number} gap_index
 * @param {string} rule_id
 */
function insert_ghosted_gap_token(gap_label, tokens, ghost_index, gap_index, rule_id) {
	const ghost_token = tokens[ghost_index]
	ghost_token.type = TOKEN_TYPE.NOTE	// temporarily change to NOTE to avoid being processed as a normal token
	add_tag_to_token(ghost_token, { 'gap_index': `${gap_index}` }, rule_id)

	const gap_token = create_gap_token(rule_id, gap_label, { 'ghost_index': `${ghost_index}`})
	tokens.splice(gap_index, 0, gap_token)
	
	gap_token.lookup_results = ghost_token.lookup_results
	ghost_token.lookup_results = []
}

/**
 * @param {Token[]} tokens
 * @param {number} ghost_index
 */
export function restore_ghost_tokens(tokens, ghost_index) {
	const ghost_token = tokens[ghost_index]
	const gap_index = parseInt(ghost_token.tag['gap_index'])
	const gap_token = tokens[gap_index]
	ghost_token.lookup_results = gap_token.lookup_results
	gap_token.lookup_results = []
	ghost_token.type = TOKEN_TYPE.LOOKUP_WORD
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