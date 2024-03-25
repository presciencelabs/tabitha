import { token_has_concept } from '$lib/parser/token'
import { check_case_frames, parse_case_frame_rule, parse_sense_rules } from './common'

const default_verb_case_frame_json = {
	'agent': {
		'directly_before_verb': { },
	},
	'patient': {
		'directly_after_verb': { },
		'comment': 'one of state or patient will be removed from the defaults depending on the stem (be/have use state instead of patient)',
	},
	'state': {
		'directly_after_verb': { },
		'comment': 'one of state or patient will be removed from the defaults depending on the stem (be/have use state instead of patient)',
	},
	'source': {
		'by_adposition': 'from',
	},
	'destination': {
		'by_adposition': 'to',
	},
	'instrument': {
		// TODO check feature on lexicon word like the Analyzer does. instruments have to be a thing, not a person
		'comment': 'An instrument is not present by default ("with" could mean other things as well)',
	},
	'addressee': {
		'trigger': { 'tag': 'head_np' },
		'context': { 'followedby': [{ 'token': ',' }, { 'category': 'Verb', 'skip': 'all' }] },
	},
	'beneficiary': {
		// TODO check feature on lexicon word like the Analyzer does. beneficiaries have to be animate, not things.
		// For now only accept proper names. Not a big deal because the beneficiary is rarely required (only provide-A requires it)
		'trigger': { 'tag': 'head_np', 'level': '4' },	
		'context': { 'precededby': { 'token': 'for', 'skip': 'np_modifiers' } },
		'context_transform': { 'function': '' },
		'comment': '"for" could mean other things as well. TODO These should be set in the transform rules',
	},
	'agent_clause': {
		'by_clause_tag': 'agent_clause',
	},
	// These are extra argument types that are not directly detected by the 'categorization' value but
	// a sense may need a specific type of.
	'patient_clause_different_participant': {
		'by_clause_tag': 'patient_clause_different_participant',
	},
	'patient_clause_same_participant': {
		'by_clause_tag': 'patient_clause_same_participant',
	},
	'patient_clause_simultaneous': {
		'by_clause_tag': 'patient_clause_simultaneous',
	},
	'patient_clause_quote_begin': {
		'by_clause_tag': 'patient_clause_quote_begin',
	},
	'predicate_adjective': {
		'predicate_adjective': {},
		'comment': 'a predicate adjective is not present by default',
	},
}

/**
 * These rules allow each verb sense to specify rules for each argument that is different from the default.
 * Only senses that differ from the default structure need to be included here.
 * 
 * @type {Map<WordStem, [WordSense, any][]>}
 */
const verb_case_frames = new Map([
	['allow', [
		['allow-A', { 'patient_clause_type': 'patient_clause_same_participant' }],
	]],
	['be', [
		['be-D', {
			'other_required': 'predicate_adjective',
			'other_optional': 'patient_clause_same_participant|patient_clause_different_participant',
			'comment': 'some predicate adjectives take a patient clause, so those should be recognized and accepted',
		}],
		['be-E', {
			'agent': {
				'trigger': { 'tag': 'head_np' },
				'context': { 'precededby': [{ 'tag': 'existential' }, { 'category': 'Verb', 'skip': ['vp_modifiers', 'np_modifiers'] }] },
				'missing_message': 'be-E requires the format \'there be X\'.',
			},
			'state': { },
		}],
		['be-F', {
			'state': {
				'trigger': { 'tag': 'head_np' },
				'context': { 'precededby': { 'category': 'Adposition', 'skip': 'np_modifiers' } },
			},
		}],
		['be-G', {
			'state': { 'directly_after_verb_with_adposition': 'for' },
			'beneficiary': { },
		}],
		['be-H', {
			'state': {
				'trigger': { 'tag': 'head_np' },
				'context': { 'precededby': { 'category': 'Adposition', 'skip': 'np_modifiers' } },
			},
		}],
		['be-I', {
			'state': { 'directly_after_verb_with_adposition': 'with' },
		}],
		['be-J', {
			'agent': {
				'directly_before_verb': { 'stem': 'date' },
				'missing_message': 'be-J requires the format \'The date be X\'.',
			},
		}],
		['be-K', {
			'agent': {
				'directly_before_verb': { 'stem': 'name' },
				'missing_message': 'be-K requires the format "X\'s name be Y" or "The name of X be Y".',
			},
		}],
		['be-N', {
			'agent': {
				'directly_before_verb': { 'stem': 'time' },
				'missing_message': 'be-N requires the format \'The time be X\' where X is a temporal noun (eg 4PM//morning).',
			},
		}],
		['be-O', {
			'agent': {
				'directly_before_verb': { 'stem': 'weather' },
				'missing_message': 'be-O requires the format \'The weather be X\' where X can be a noun (eg rain) or adjective (eg hot).',
			},
			'other_optional': 'predicate_adjective',
		}],
		['be-P', {
			'state': { 'directly_after_verb_with_adposition': 'about' },
		}],
		['be-Q', {
			'state': {
				'trigger': { 'tag': 'head_np' },
				'context': { 'precededby': { 'category': 'Verb', 'skip': ['vp_modifiers', 'np_modifiers', { 'token': 'made' }] } },
			},
			'comment': 'there may or may not be "made of" before the np',
		}],
		['be-R', {
			'state': {
				'directly_after_verb_with_adposition': 'part',
				'missing_message': 'be-R requires the format \'X be part of Y\'',
			},
		}],
		['be-S', {
			'predicate_adjective': {
				'trigger': { 'token': 'old' },
				'context': { 'precededby': [{ 'category': 'Adjective' }, { 'stem': 'year|month|day' }] },
				'transform': { 'concept': 'old-B' },
				'missing_message': 'be-S requires the format \'be X years//months//etc old(-B)\'.',
			},
			'state': { },
			'other_required': 'predicate_adjective',
			'comment': "clear the 'state' argument so it doesn't get triggered by 'year/month/day' etc. 'old' is the predicate adjective.",
		}],
		['be-T', {
			'state': { 'directly_after_verb_with_adposition': 'from' },
			'source': { },
		}],
		['be-U', { 'state': { 'directly_after_verb_with_adposition': 'like' } }],
		['be-V', { 'other_required': 'predicate_adjective' }],
		['be-W', { 'state': { 'directly_after_verb_with_adposition': 'in' } }],
		['be-X', { 'state': { 'directly_after_verb_with_adposition': 'like' } }],
	]],
	['give', [
		['give-A', {
			'patient': {
				'directly_after_verb': { },
				'missing_message': "'give' requires the patient to immediately follow the Verb. Make sure to use 'to X' for the destination.",
			},
		}],
	]],
	['have', [
		['know-J', { 'instrument': { 'by_adposition': 'with' } }],
	]],
	['hear', [
		['hear-A', { 'instrument': { 'by_adposition': 'with' } }],
		['hear-B', { 'instrument': { 'by_adposition': 'with' } }],
		['hear-C', { 'other_optional': 'patient_clause_simultaneous' }],
		['hear-D', { 'patient': { 'by_adposition': 'about' } }],
	]],
	['know', [
		['know-D', { 'patient': { 'directly_after_verb_with_adposition': 'about' } }],
		['know-B', { 'instrument': { 'by_adposition': 'with' } }],
	]],
	['say', [
		['say-A', { 'patient_clause_type': 'patient_clause_quote_begin' }],
		['say-E', { 'patient_clause_type': 'patient_clause_quote_begin' }],
		['say-F', { 'patient_clause_type': 'patient_clause_quote_begin' }],
	]],
	['see', [
		['see-B', { 'other_optional': 'patient_clause_simultaneous' }],
	]],
	['speak', [
		['speak-A', {
			'patient': { 'by_adposition': 'about' },
			'instrument': {
				'by_adposition': 'in',
				'context_transform': { 'concept': 'in-K' },
			},	// in a language
		}],
	]],
	['tell', [
		['tell-A', {
			'instrument': { 'by_adposition': 'with' },
			'patient_clause_different_participant': { 'by_clause_tag': 'patient_clause_different_participant|relative_clause_that' },
			'comment': 'the patient clause may have been interpreted as a relative clause if \'that\' was present',
		}],
		['tell-B', { 'patient_clause_type': 'patient_clause_same_participant' }],
		['tell-C', {
			'destination': { 'directly_after_verb': { } },
			'instrument': { 'by_adposition': 'with' },
			'patient': { 'by_adposition': 'about' },
		}],
		['tell-D', { 'instrument': { 'by_adposition': 'with' } }],
		['tell-E', {
			'destination': { 'directly_after_verb': { } },
			'patient': { },		// clear the patient so it doesn't get confused with the destination
			'patient_clause_type': 'patient_clause_quote_begin',
		}],
	]],
])

const VERB_LETTER_TO_ROLE = new Map([
	['A', 'agent'],
	['B', 'patient'],
	['C', 'state'],
	['D', 'source'],
	['E', 'destination'],
	['F', 'instrument'],
	['G', 'beneficiary'],
	['H', 'patient_clause'],
	['I', 'agent_clause'],
])

/**
 * @returns {ArgumentRoleRule[]}
 */
function create_default_argument_rules() {
	return Object.entries(default_verb_case_frame_json).map(parse_case_frame_rule)
}

/**
 * @returns {Map<WordStem, ArgumentRulesForSense[]>}
 */
function create_verb_argument_rules() {
	return new Map([...verb_case_frames.entries()].map(create_rules_for_stem))

	/**
	 * 
	 * @param {[WordStem, [WordSense, any][]]} stem_rules 
	 * @returns {[WordStem, ArgumentRulesForSense[]]}
	 */
	function create_rules_for_stem([stem, sense_rules_json]) {
		const defaults = get_default_rules_for_stem(stem)
		return [stem, parse_sense_rules(sense_rules_json, defaults)]
	}
}

/**
 * 
 * @param {WordStem} stem 
 * @returns {ArgumentRoleRule[]}
 */
function get_default_rules_for_stem(stem) {
	const role_to_remove = ['be', 'have'].includes(stem) ? 'patient' : 'state'
	return DEFAULT_CASE_FRAME_RULES.filter(rule => rule.role_tag !== role_to_remove)
}

const DEFAULT_CASE_FRAME_RULES = create_default_argument_rules()
const VERB_CASE_FRAME_RULES = create_verb_argument_rules()

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} verb_index 
 * @param {((rules: ArgumentRulesForSense[]) => ArgumentRulesForSense[])} rules_modifier
 */
export function check_verb_case_frames(tokens, verb_index, rules_modifier=rules => rules) {
	const verb_token = tokens[verb_index]
	if (!token_has_concept(verb_token)) {
		return
	}

	const stem = verb_token.lookup_results[0].stem
	const argument_rules_by_sense = VERB_CASE_FRAME_RULES.get(stem)

	// TODO remove this at some point and default to empty map instead
	if (!argument_rules_by_sense) {
		return
	}

	check_case_frames(tokens, verb_index, {
		rules_by_sense: rules_modifier(argument_rules_by_sense),
		default_rules: get_default_rules_for_stem(stem),
		role_letter_map: VERB_LETTER_TO_ROLE,
	})
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} verb_index 
 */
export function check_verb_case_frames_passive(tokens, verb_index) {
	// for a passive, the 'patient' goes right before the verb and the 'agent' is detected by the adposition 'by'
	const passive_rules = [
		parse_case_frame_rule(['patient', {
			'directly_before_verb': { },
			'missing_message': 'A patient is required, which goes before the Verb in the passive.',
		}]),
		parse_case_frame_rule(['agent', {
			'by_adposition': 'by',
			'missing_message': 'An agent is required, which for a passive is preceded by \'by\'.',
		}]),
	]

	check_verb_case_frames(tokens, verb_index, sense_rules => 
		sense_rules.map(rules_for_sense => ({
			...rules_for_sense,
			rules: rules_for_sense.rules.filter(rule => !['patient', 'agent'].includes(rule.role_tag)).concat(passive_rules),
		})),
	)
}

// TODO add check for questions and relative clauses