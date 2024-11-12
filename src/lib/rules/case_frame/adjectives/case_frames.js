import { check_case_frames, parse_case_frame_rule, parse_sense_rules } from '../common'
import { by_adposition, by_clause_tag, by_complementizer, modified_noun_of_adjective, subgroup_with_optional_of, unit_with_measure } from './presets'

/** @type {RoleRuleJson<AdjectiveRoleTag>} */
const default_adjective_case_frame_json = {
	'modified_noun': modified_noun_of_adjective(),
	'nominal_argument': { 'trigger': 'none' },
	'patient_clause_different_participant': by_clause_tag('patient_clause_different_participant'),
	'patient_clause_same_participant': by_clause_tag('patient_clause_same_participant'),
}

/**
 * These rules allow each adjective sense to specify rules for each argument that is different from the default.
 * Only senses that differ from the default structure need to be included here.
 * 
 * @type {Map<WordStem, [WordSense, SenseRuleJson<AdjectiveRoleTag>][]>}
 */
const adjective_case_frames = new Map([
	['afraid', [
		['afraid-B', { 'nominal_argument': by_adposition('of') }],
	]],
	['all', [
		['all-A', subgroup_with_optional_of()],
		['all-B', subgroup_with_optional_of()],
	]],
	['amazed', [
		['amazed-B', { 'nominal_argument': by_adposition('of|by') }],
	]],
	['angry', [
		['angry-B', { 'nominal_argument': by_adposition('at|with') }],
	]],
	['ashamed', [
		['ashamed-B', { 'nominal_argument': by_adposition('of|by') }],
	]],
	['attracted', [
		['attracted-A', { 'nominal_argument': by_adposition('to') }],
	]],
	['close', [
		['close-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['content', [
		['content-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['cruel', [
		['cruel-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['deep', [
		['deep-A', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['different', [
		['different-B', { 'nominal_argument': by_adposition('from') }],
	]],
	['each', [
		['each-A', subgroup_with_optional_of()],
	]],
	['faithful', [
		['faithful-B', { 'nominal_argument': by_adposition('to') }],
		['faithful-C', { 'nominal_argument': by_adposition('with') }],
	]],
	['far', [
		['far-A', { 'nominal_argument': by_adposition('from') }],
	]],
	['gentle', [
		['gentle-B', { 'nominal_argument': by_adposition('with|to') }],
	]],
	['happy', [
		['happy-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['honest', [
		['honest-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['important', [
		['important-A', { 'nominal_argument': by_adposition('to') }],
	]],
	['jealous', [
		['jealous-A', { 'nominal_argument': by_adposition('of|by') }],
	]],
	['kind', [
		['kind-B', { 'nominal_argument': by_adposition('with|to') }],
	]],
	['long', [
		['long-C', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['merciful', [
		['merciful-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['much-many', [
		['much-many-A', subgroup_with_optional_of()],
	]],
	['old', [
		['old-B', { 'nominal_argument': unit_with_measure('time') }],
	]],
	['one', [
		['one-A', subgroup_with_optional_of()],
	]],
	['patient', [
		['patient-B', { 'nominal_argument': by_adposition('with') }],
	]],
	['pleased', [
		['pleased-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['proud', [
		['proud-B', { 'nominal_argument': by_adposition('of') }],
	]],
	['ready', [
		['ready-C', {
			'patient_clause_different_participant': [
				by_clause_tag('patient_clause_different_participant'),
				by_complementizer('for'),
			],
		}],
	]],
	['responsible', [
		['responsible-A', { 'nominal_argument': by_adposition('for') }],
	]],
	['sad', [
		['sad-A', { 'nominal_argument': by_adposition('about') }],
		['sad-B', { 'nominal_argument': by_adposition('for') }],
	]],
	['some', [
		['some-A', subgroup_with_optional_of()],
	]],
	['tall', [
		['tall-A', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['upset', [
		['upset-B', { 'nominal_argument': by_adposition('with') }],
		['upset-C', { 'nominal_argument': by_adposition('about') }],
	]],
	['wide', [
		['wide-C', { 'nominal_argument': unit_with_measure('length') }],
	]],
])

/**
 * @returns {ArgumentRoleRule[]}
 */
function create_default_argument_rules() {
	return Object.entries(default_adjective_case_frame_json)
		.flatMap(rule_json => parse_case_frame_rule(rule_json))
}

/**
 * @returns {Map<WordStem, ArgumentRulesForSense[]>}
 */
function create_adjective_argument_rules() {
	return new Map([...adjective_case_frames.entries()].map(create_rules_for_stem))

	/**
	 * 
	 * @param {[WordStem, [WordSense, SenseRuleJson<AdjectiveRoleTag>][]]} stem_rules 
	 * @returns {[WordStem, ArgumentRulesForSense[]]}
	 */
	function create_rules_for_stem([stem, sense_rules_json]) {
		return [stem, parse_sense_rules(sense_rules_json, DEFAULT_CASE_FRAME_RULES)]
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
		default_rule_getter: () => DEFAULT_CASE_FRAME_RULES,
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
	// The first character of the categorization is the category (Generic, Quantity, Cardinal Number, etc) and not used for usage
	const role_letters = [...categorization.slice(1)].filter(c => c !== '_')
	
	// some categorizations are blank or erroneously all underscores (eg early-A)
	// treat all arguments as possible and not required
	if (role_letters.length === 0) {
		return {
			possible_roles: [...ADJECTIVE_LETTER_TO_ROLE.values()],
			required_roles: [],
		}
	}

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
