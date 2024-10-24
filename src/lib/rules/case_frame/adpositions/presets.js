/**
 * 
 * @returns {CaseFrameRuleJson}
 */
export function opening_subordinate_clause() {
	return {
		...by_relative_context({
			'precededby': { 'token': '[', 'skip': { 'tag': 'coord_clause' } },
		}),
		'tag_role': false,
		'main_word_tag': { 'syntax': 'adverbial_clause_adposition' },
		'missing_message': "Missing '[' bracket before adverbial clause.",
	}
}

/**
 * 
 * @returns {CaseFrameRuleJson}
 */
export function head_noun() {
	return {
		...by_relative_context({
			'followedby': { 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
		}),
		'tag_role': false,
		'main_word_tag': { 'pre_np_adposition': 'oblique' },
		'missing_message': 'Could not find the Noun associated with this Adposition.',
	}
}

/**
 * 
 * @param {TokenContextFilterJson} relative_context 
 * @returns {CaseFrameRuleJson}
 */
export function by_relative_context(relative_context) {
	return {
		'trigger': 'all',
		'context': relative_context,
	}
}