import { TOKEN_TYPE } from '$lib/parser/token'
import { check_case_frames, parse_case_frame_rule, parse_sense_rules } from './common'

const default_adjective_case_frame_json = {
	'modified_noun': {
		'modified_noun_of_adjective': { },
	},
	'nominal_argument': {
		'trigger': 'none',
	},
	'patient_clause_different_participant': {
		'by_clause_tag': 'patient_clause_different_participant',
	},
	'patient_clause_same_participant': {
		'by_clause_tag': 'patient_clause_same_participant',
	},
}

/** @type {RoleRulePreset[]} */
// @ts-ignore the map initializer array doesn't like the different object structures
const ROLE_RULE_PRESETS = [
	['by_adposition', preset_value => ({
		'by_relative_context': {
			'followedby': [
				{ 'token': preset_value },
				{ 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
			],
			'argument_context_index': 1,
		},
		'transform': { 'tag': { 'role': 'adjective_nominal_argument', 'syntax': 'nested_np' } },
		'context_transform': { 'function': { 'syntax': 'argument_adposition', 'relation': '' } },	// make the adposition a function word and clear other tag values
		'missing_message': `Couldn't find the nominal argument, which in this case should have '${preset_value}' before it.`,
	})],
	['by_clause_tag', preset_value => ({
		'by_relative_context': {
			'followedby': { 'type': TOKEN_TYPE.CLAUSE, 'tag': { 'clause_type': preset_value, 'role': 'none' } },
			'comment': 'the clause should immediately follow the adjective',
		},
	})],
	['modified_noun_of_adjective', () => ({ 
		'by_relative_context': {
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
			'notfollowedby': { 'token': 'of' },
		},
		'tag_role': false,
		'comment': '"of" is a relation that can be part of an NP, but is also used for some nominal arguments and should not be skipped if it immediately follows the Adj (eg. John was afraid of Mary)',
	})],
	['subgroup_with_of', () => ({
		'by_relative_context': {
			'followedby': [
				{ 'token': 'of' },
				{ 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
			],
			'argument_context_index': 1,
		},
		'context_transform': { 'function': { 'relation': 'subgroup' } },
		'tag_role': false,
	})],
	['unit_with_measure', preset_value => ({
		'by_relative_context': {
			'precededby': { 'category': 'Noun' },
		},
		'transform': { 'tag': { 'role': 'adjective_nominal_argument', 'syntax': 'nested_np' } },
		'missing_message': `{sense} must be in the format 'N X {stem}' where N is a number/quantity and X is a unit of ${preset_value}.`,
	})],
	['by_relative_context', preset_value => ({
		'trigger': 'all',
		'context': preset_value,
		'argument_context_index': preset_value['argument_context_index'] ?? 0,
	})],
]

/**
 * These rules allow each adjective sense to specify rules for each argument that is different from the default.
 * Only senses that differ from the default structure need to be included here.
 * 
 * @type {Map<WordStem, [WordSense, any][]>}
 */
const adjective_case_frames = new Map([
	['afraid', [
		['afraid-B', { 'nominal_argument': { 'by_adposition': 'of' } }],
	]],
	['all', [
		['all-A', {
			'modified_noun': [
				{ 'modified_noun_of_adjective': { } },
				{ 'subgroup_with_of': { } },
			],
			'comment': "'all X' and 'all of X' are both supported",
		}],
		['all-B', {
			'modified_noun': [
				{ 'modified_noun_of_adjective': { } },
				{ 'subgroup_with_of': { } },
			],
			'comment': "'all X' and 'all of X' are both supported",
		}],
	]],
	['amazed', [
		['amazed-B', { 'nominal_argument': { 'by_adposition': 'of|by' } }],
	]],
	['angry', [
		['angry-B', { 'nominal_argument': { 'by_adposition': 'at|with' } }],
	]],
	['ashamed', [
		['ashamed-B', { 'nominal_argument': { 'by_adposition': 'of|by' } }],
	]],
	['attracted', [
		['attracted-A', { 'nominal_argument': { 'by_adposition': 'to' } }],
	]],
	['close', [
		['close-B', { 'nominal_argument': { 'by_adposition': 'to' } }],
	]],
	['content', [
		['content-A', { 'nominal_argument': { 'by_adposition': 'with' } }],
	]],
	['cruel', [
		['cruel-B', { 'nominal_argument': { 'by_adposition': 'to' } }],
	]],
	['deep', [
		['deep-A', { 'nominal_argument': { 'unit_with_measure': 'length' } }],
	]],
	['different', [
		['different-B', { 'nominal_argument': { 'by_adposition': 'from' } }],
	]],
	['each', [
		['each-A', {
			'modified_noun': [
				{ 'modified_noun_of_adjective': { } },
				{ 'subgroup_with_of': { } },
			],
			'comment': "'each X' and 'each of X' are both supported",
		}],
	]],
	['faithful', [
		['faithful-B', { 'nominal_argument': { 'by_adposition': 'to' } }],
		['faithful-C', { 'nominal_argument': { 'by_adposition': 'with' } }],
	]],
	['far', [
		['far-A', { 'nominal_argument': { 'by_adposition': 'from' } }],
	]],
	['gentle', [
		['gentle-B', { 'nominal_argument': { 'by_adposition': 'with|to' } }],
	]],
	['happy', [
		['happy-A', { 'nominal_argument': { 'by_adposition': 'with' } }],
	]],
	['honest', [
		['honest-A', { 'nominal_argument': { 'by_adposition': 'with' } }],
	]],
	['important', [
		['important-A', { 'nominal_argument': { 'by_adposition': 'to' } }],
	]],
	['jealous', [
		['jealous-A', { 'nominal_argument': { 'by_adposition': 'of|by' } }],
	]],
	['kind', [
		['kind-B', { 'nominal_argument': { 'by_adposition': 'with|to' } }],
	]],
	['long', [
		['long-C', { 'nominal_argument': { 'unit_with_measure': 'length' } }],
	]],
	['merciful', [
		['merciful-B', { 'nominal_argument': { 'by_adposition': 'to' } }],
	]],
	['much-many', [
		['much-many-A', {
			'modified_noun': [
				{ 'modified_noun_of_adjective': { } },
				{ 'subgroup_with_of': { } },
			],
			'comment': "'muhc/many X' and 'much/many of X' are both supported",
		}],
	]],
	['old', [
		['old-B', { 'nominal_argument': { 'unit_with_measure': 'time' } }],
	]],
	['one', [
		['one-A', {
			'modified_noun': [
				{ 'modified_noun_of_adjective': { } },
				{ 'subgroup_with_of': { } },
			],
			'comment': "'one X' and 'one of X' are both supported",
		}],
	]],
	['patient', [
		['patient-B', { 'nominal_argument': { 'by_adposition': 'with' } }],
	]],
	['pleased', [
		['pleased-A', { 'nominal_argument': { 'by_adposition': 'with' } }],
	]],
	['proud', [
		['proud-B', { 'nominal_argument': { 'by_adposition': 'of' } }],
	]],
	['responsible', [
		['responsible-A', { 'nominal_argument': { 'by_adposition': 'for' } }],
	]],
	['sad', [
		['sad-A', { 'nominal_argument': { 'by_adposition': 'about' } }],
		['sad-B', { 'nominal_argument': { 'by_adposition': 'for' } }],
	]],
	['some', [
		['some-A', {
			'modified_noun': [
				{ 'modified_noun_of_adjective': { } },
				{ 'subgroup_with_of': { } },
			],
			'comment': "'some X' and 'some of X' are both supported",
		}],
	]],
	['tall', [
		['tall-A', { 'nominal_argument': { 'unit_with_measure': 'length' } }],
	]],
	['upset', [
		['upset-B', { 'nominal_argument': { 'by_adposition': 'with' } }],
		['upset-C', { 'nominal_argument': { 'by_adposition': 'about' } }],
	]],
	['wide', [
		['wide-C', { 'nominal_argument': { 'unit_with_measure': 'length' } }],
	]],
])

/**
 * @returns {ArgumentRoleRule[]}
 */
function create_default_argument_rules() {
	return Object.entries(default_adjective_case_frame_json)
		.flatMap(rule_json => parse_case_frame_rule(rule_json, ROLE_RULE_PRESETS))
}

/**
 * @returns {Map<WordStem, ArgumentRulesForSense[]>}
 */
function create_adjective_argument_rules() {
	return new Map([...adjective_case_frames.entries()].map(create_rules_for_stem))

	/**
	 * 
	 * @param {[WordStem, [WordSense, any][]]} stem_rules 
	 * @returns {[WordStem, ArgumentRulesForSense[]]}
	 */
	function create_rules_for_stem([stem, sense_rules_json]) {
		const presets = { role_presets: ROLE_RULE_PRESETS }
		return [stem, parse_sense_rules(sense_rules_json, DEFAULT_CASE_FRAME_RULES, presets)]
	}
}

const DEFAULT_CASE_FRAME_RULES = create_default_argument_rules()
const ADJECTIVE_CASE_FRAME_RULES = create_adjective_argument_rules()

/**
 * 
 * @param {RuleTriggerContext} trigger_context
 */
export function check_adjective_case_frames(trigger_context) {
	const adjective_token = trigger_context.trigger_token

	const stem = adjective_token.lookup_results[0].stem
	const argument_rules_by_sense = ADJECTIVE_CASE_FRAME_RULES.get(stem) ?? []

	check_case_frames(trigger_context, {
		rules_by_sense: argument_rules_by_sense,
		default_rules: DEFAULT_CASE_FRAME_RULES,
		role_info_getter: get_adjective_usage_info,
	})
}

const ADJECTIVE_LETTER_TO_ROLE = new Map([
	['A', 'modified_noun'],
	['B', 'modified_noun'],	// 'A' and 'B' are usually compatible - 'A' is attributive (the happy dog) and 'B' is a simple predicate (the dog is happy)
	['C', 'nominal_argument'],
	['D', 'patient_clause_same_participant'],
	['E', 'patient_clause_different_participant'],
])

/**
 * 
 * @param {string} categorization 
 * @param {ArgumentRulesForSense} role_rules
 * @returns {RoleUsageInfo}
 */
function get_adjective_usage_info(categorization, role_rules) {
	// some categorizations are blank - treat all arguments as possible and not required
	if (categorization.length === 0) {
		return {
			possible_roles: [...ADJECTIVE_LETTER_TO_ROLE.values()],
			required_roles: [],
		}
	}

	// The first character of the categorization is the category (Generic, Quantity, Cardinal Number, etc) and not used for usage
	const role_letters = [...categorization.slice(1)].filter(c => c !== '_')

	/** @type {string[]} */
	// @ts-ignore
	const possible_roles = role_letters
		.map(c => ADJECTIVE_LETTER_TO_ROLE.get(c.toUpperCase()))
		.concat([...role_rules.other_optional, ...role_rules.other_required])
		.filter(role => role)

	/** @type {string[]} */
	// @ts-ignore
	const required_roles = role_letters
		.map(c => ADJECTIVE_LETTER_TO_ROLE.get(c))
		.concat(role_rules.other_required)
		.filter(role => role && role !== 'modified_noun')
		// a modified noun should never be required, as usually it's possible for it to also be used predicatively

	return { possible_roles, required_roles }
}
