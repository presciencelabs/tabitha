import { TOKEN_TYPE } from '$lib/token'

/**
 * 
 * @returns {SenseRuleJson<VerbRoleTag>}
 */
export function patient_from_subordinate_clause() {
	return {
		'patient': {
			...by_clause_tag('patient_clause_different_participant'),
			'missing_message': "{sense} should be written in the format 'X {stem} [Y to Verb]'.",
		},
		'other_rules': {
			'extra_patient': {
				...directly_after_verb(),
				'extra_message': "{sense} should not be written with the patient. Use the format 'X {stem} [Y to Verb]'.",
			},
		},
		'comment': 'the patient is omitted in the phase 1 and copied from within the subordinate. so treat the clause like the patient',
	}
}

/**
 * 
 * @param {string} adposition 
 * @returns {CaseFrameRuleJson}
 */
export function by_adposition(adposition) {
	return {
		'trigger': { 'tag': { 'syntax': 'head_np' } },
		'context': { 'precededby': { 'token': adposition, 'skip': 'np_modifiers' } },
		'context_transform': { 'function': { 'pre_np_adposition': 'verb_argument' } },
		'missing_message': `Couldn't find the {role}, which in this case should have '${adposition}' before it.`,
	}
}

/**
 * 
 * @param {string} clause_type 
 * @returns {CaseFrameRuleJson}
 */
export function by_clause_tag(clause_type) {
	return {
		'trigger': { 'type': TOKEN_TYPE.CLAUSE, 'tag': { 'clause_type': clause_type, 'role': 'none' } },
	}
}

/**
 * 
 * @param {TokenFilterJsonBase} token_filter 
 * @returns {CaseFrameRuleJson}
 */
export function directly_before_verb(token_filter={}) {
	return by_relative_context({
		'precededby': {
			'tag': { 'syntax': 'head_np' },
			'skip': ['np', 'vp_modifiers'], // skip 'np' because there might be a genitive (eg 'man of God')
			...token_filter,
		},
	})
}

/**
 * 
 * @param {TokenFilterJsonBase} token_filter 
 * @returns {CaseFrameRuleJson}
 */
export function directly_after_verb(token_filter={}) {
	return by_relative_context({
		'followedby': {
			'tag': { 'syntax': 'head_np' },
			'skip': ['vp_modifiers', 'np_modifiers'],
			...token_filter,
		},
	})
}

/**
 * 
 * @param {string} adposition 
 * @returns {CaseFrameRuleJson}
 */
export function directly_after_verb_with_adposition(adposition) {
	return {
		...by_relative_context({
			'followedby': [
				{ 'token': adposition, 'skip': 'vp_modifiers' },
				{ 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
			],
		}),
		'argument_context_index': 1,
		'context_transform': { 'function': { 'pre_np_adposition': 'verb_argument' } },	// make the adposition a function word
		'missing_message': `Couldn't find the {role}, which for {sense} should have '${adposition}' before it.`,
	}
}

/**
 * 
 * @returns {CaseFrameRuleJson}
 */
export function predicate_adjective() {
	return by_relative_context({
		'followedby': {
			'category': 'Adjective',
			'tag': { 'adj_usage': 'predicative' },
			'skip': ['adjp_modifiers_predicative', 'advp', { 'tag': 'verb_polarity' }],
		},
	})
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
		'argument_context_index': 0,
	}
}