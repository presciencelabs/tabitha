import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { TOKEN_TYPE, stem_with_sense, create_case_frame, create_token, format_token_message } from '$lib/token'
import { pipe } from '$lib/pipeline'
import { parse_transform_rule } from '../transform_rules'

/**
 * 
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function missing_argument_message(role_tag) {
	const messages = new Map([
		['agent_clause', "Couldn't find an agent clause (e.g. 'It {stem} [X...]' or '[X...] {stem}...')."],
		['patient_clause_quote_begin', 'A direct-speech patient clause is required.'],
		['patient_clause_different_participant', 'The patient clause for {sense} must have an explicit subject.'],
		['patient_clause_same_participant', "The patient clause for {sense} should be written like '{stem} [to sing]')."],
		['patient_clause_simultaneous', "A simultaneous perception clause is required (e.g. 'John {token} [Mary singing]')."],
	])
	return messages.get(role_tag) ?? "Couldn't find the {role} for this {category}."
}

/**
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function extra_argument_message(role_tag) {
	const consult_message = "Consult the {category}'s Theta Grid usage."
	const messages = new Map([
		['patient', `Unexpected {role} for {sense}. ${consult_message}`],
		['source', `Unexpected {role} for {sense}. ${consult_message}`],
		['destination', `Unexpected {role} for {sense}. ${consult_message}`],
		['beneficiary', '{sense} does not usually take a {role}. Check to make sure its usage is acceptable.'],
		['instrument', '{sense} does not usually take a {role}. Check to make sure its usage is acceptable.'],
		['agent_clause', `{sense} cannot be used with an agent clause. ${consult_message}`],
		['patient_clause_different_participant', `{sense} cannot be used with a different-participant patient clause. ${consult_message}`],
		['patient_clause_same_participant', `{sense} cannot be used with a same-participant patient clause. ${consult_message}`],
		['patient_clause_simultaneous', `{sense} cannot be used with a simultaneous perception clause. ${consult_message}`],
		['patient_clause_quote_begin', `{sense} cannot be used with direct speech. ${consult_message}`],
		['predicate_adjective', `{sense} cannot be used with a predicate Adjective. ${consult_message}`],
		['modified_noun', `{sense} cannot be used attributively. ${consult_message}`],
	])
	return messages.get(role_tag) ?? 'Unexpected {role} for {sense}. Consult its usage in the Ontology.'
}

/** @type {[RoleTag, string][]} */
const ALL_HAVE_MISSING_ARGUMENT_MESSAGES = [
	// If no Verb sense could find an agent (or agent_clause), there's probably a bracketing issue. Make the message more clear.
	['agent', 'Could not find the agent of this verb. Check other errors and warnings for more help.'],
	['opening_subordinate_clause', "Missing '[' bracket before adverbial clause."],
]

/** @type {[RoleTag, string][]} */
const ALL_HAVE_EXTRA_ARGUMENT_MESSAGES = [
	['patient_clause_same_participant', 'Unexpected patient clause for {category} \'{stem}\'. This likely should be \'[in-order-to...]\' or \'[so-that...]\' instead.'],
	['patient_clause_quote_begin', '\'{stem}\' can never be used with direct speech. Consult its usage in the Ontology.'],
	['predicate_adjective', '\'{stem}\' can never be used with a predicate adjective. Consider using something like \'cause [X to be...]\'. Consult its usage in the Ontology.'],
]

/**
 * 
 * @param {[RoleTag, RoleRuleValueJson]} rule_json 
 * @returns {ArgumentRoleRule[]}
 */
export function parse_case_frame_rule([role_tag, rule_json]) {
	if (Array.isArray(rule_json)) {
		// An argument role may have multiple possible trigger rules, ie different structures that are allowed.
		return rule_json.flatMap(rule_option => parse_case_frame_rule([role_tag, rule_option]))
	}

	const tag_role = rule_json['tag_role'] ?? true
	const tag_transform = tag_role ? { 'tag': { 'role': role_tag } } : {}

	rule_json['transform'] = { ...tag_transform, ...rule_json['transform'] ?? {} }

	const missing_message = rule_json['missing_message'] ?? missing_argument_message(role_tag)
	const extra_message = rule_json['extra_message'] ?? extra_argument_message(role_tag)

	return [{
		role_tag,
		trigger_rule: parse_transform_rule(rule_json),
		relative_context_index: rule_json['argument_context_index'] ?? -1,
		missing_message: missing_message.replaceAll('{role}', role_tag),
		extra_message: extra_message.replaceAll('{role}', role_tag),
		main_word_tag: rule_json['main_word_tag'] ?? {},
	}]
}

/**
 * @param {[WordSense, any][]} rule_json
 * @param {ArgumentRoleRule[]} defaults
 * @returns {ArgumentRulesForSense[]}
 */
export function parse_sense_rules(rule_json, defaults) {
	return rule_json.map(parse_sense_rule(defaults))

	/**
	 * 
	 * @param {ArgumentRoleRule[]} defaults
	 * @returns {(rule_json: [WordSense, any]) => ArgumentRulesForSense}
	 */
	function parse_sense_rule(defaults) {
		return ([sense, rules_json]) => {
			const role_rules = defaults.flatMap(rule => rule.role_tag in rules_json
				? parse_case_frame_rule([rule.role_tag, rules_json[rule.role_tag]])
				: [rule])

			const other_rules = 'other_rules' in rules_json
				? Object.entries(rules_json['other_rules']).flatMap(parse_case_frame_rule)
				: []

			return {
				sense,
				rules: role_rules.concat(other_rules),
				other_optional: rules_json['other_optional']?.split('|') ?? [],
				other_required: rules_json['other_required']?.split('|') ?? [],
				patient_clause_type: rules_json['patient_clause_type'] ?? '',
			}
		}
	}
}

/**
 * @typedef {(lookup: LookupResult) => ArgumentRoleRule[]} DefaultRuleGetter
 * @typedef {(categorization: string, role_rules: ArgumentRulesForSense) => RoleUsageInfo} RoleInfoGetter
 * @typedef {{ rules_by_sense: ArgumentRulesForSense[], default_rule_getter: DefaultRuleGetter, role_info_getter: RoleInfoGetter }} RuleInfo
 * 
 * @param {RuleTriggerContext} trigger_context
 * @param {RuleInfo} rule_info
 */
export function check_case_frames(trigger_context, { rules_by_sense, default_rule_getter, role_info_getter }) {
	const pipeline = pipe(
		get_rules_for_sense(rules_by_sense, default_rule_getter),
		match_sense_rules(trigger_context),
		check_usage(role_info_getter),
	)

	for (const lookup of trigger_context.trigger_token.lookup_results.filter(LOOKUP_FILTERS.IS_IN_ONTOLOGY)) {
		lookup.case_frame = pipeline(lookup)
	}
}

/**
 * 
 * @param {ArgumentRulesForSense[]} rules_by_sense 
 * @param {DefaultRuleGetter} default_rule_getter
 * @returns {(lookup: LookupResult) => [LookupResult, ArgumentRulesForSense]}
 */
function get_rules_for_sense(rules_by_sense, default_rule_getter) {
	/** @type {ArgumentRulesForSense} */
	return lookup => {
		const defaults_for_stem = {
			sense: '',
			rules: default_rule_getter(lookup),
			other_optional: [],
			other_required: [],
			patient_clause_type: '',
		}

		const sense = stem_with_sense(lookup)
		return [lookup, rules_by_sense.find(rule => rule.sense === sense) ?? { ...defaults_for_stem, sense }]
	}
}

/**
 * 
 * @param {RuleTriggerContext} main_trigger_context 
 * @returns {(param: [LookupResult, ArgumentRulesForSense]) => [LookupResult, ArgumentRulesForSense, RoleMatchResult[]]}
 */
function match_sense_rules(main_trigger_context) {
	return ([lookup, sense_rule]) => [
		lookup,
		sense_rule,
		sense_rule.rules.map(rule => match_argument_rule(main_trigger_context, rule)).filter(match => match.success),
	]
}

/**
 * 
 * @param {RuleTriggerContext} main_trigger_context 
 * @param {ArgumentRoleRule} rule 
 * @returns {RoleMatchResult}
 */
function match_argument_rule(main_trigger_context, rule) {
	const { tokens } = main_trigger_context
	const { trigger, context } = rule.trigger_rule

	if (rule.relative_context_index >= 0) {
		// The rule should be interpreted as relative to the main word
		const context_result = context(tokens, main_trigger_context.trigger_index)

		if (!context_result.success) {
			return create_role_match_result(rule, false)
		}

		const argument_index = context_result.context_indexes[rule.relative_context_index]

		return create_role_match_result(rule, true, {
			tokens,
			trigger_index: argument_index,
			trigger_token: tokens[argument_index],
			...context_result,
		})

	} else {
		// The rule stands alone within the clause, not relative to the main word
		for (let i = 0; i < tokens.length;) {
			if (!trigger(tokens[i])) {
				i++
				continue
			}
			const context_result = context(tokens, i)
			if (!context_result.success) {
				i++
				continue
			}

			return create_role_match_result(rule, true, {
				tokens,
				trigger_index: i,
				trigger_token: tokens[i],
				...context_result,
			})
		}

		return create_role_match_result(rule, false)
	}
}

/**
 * 
 * @param {ArgumentRoleRule} rule 
 * @param {boolean} success 
 * @param {RuleTriggerContext?} argument_context 
 * @returns {RoleMatchResult}
 */
function create_role_match_result(rule, success, argument_context=null) {
	return {
		role_tag: rule.role_tag,
		success,
		trigger_context: argument_context ?? {
			tokens: [],
			trigger_index: -1,
			trigger_token: create_token('', TOKEN_TYPE.NOTE),
			context_indexes: [],
			subtoken_indexes: [],
		},
		rule,
	}
}

/**
 * @param {RoleInfoGetter} role_info_getter
 * @returns {(param: [LookupResult, ArgumentRulesForSense, RoleMatchResult[]]) => CaseFrameResult}
 */
function check_usage(role_info_getter) {
	return ([lookup, role_rules, role_matches]) => {
		if (lookup.ontology_id === 0) {
			return create_case_frame({ is_valid: false, is_checked: false })
		}

		const { possible_roles, required_roles } = role_info_getter(lookup.categorization, role_rules)

		const valid_arguments = role_matches.filter(({ role_tag }) => possible_roles.includes(role_tag))
		const extra_arguments = role_matches.filter(({ role_tag }) => !possible_roles.includes(role_tag))

		/** @type {ArgumentRoleRule[]} */
		// @ts-ignore there will always be a rule
		const missing_arguments = required_roles
			.filter(role => !role_matches.some(({ role_tag }) => role_tag === role))
			.map(role => role_rules.rules.find(rule => rule.role_tag === role))	// TODO all we really care about here is the message
			.filter(rule => rule)

		const is_valid = extra_arguments.length === 0 && missing_arguments.length === 0

		return create_case_frame({
			is_valid,
			is_checked: true,
			valid_arguments,
			missing_arguments,
			extra_arguments,
		})
	}
}

/**
 * 
 * @param {RuleTriggerContext} trigger_context
 */
export function* validate_case_frame(trigger_context) {
	const token = trigger_context.trigger_token

	if (no_matches_and_ambiguous_sense(token)) {
		const missing_role = ALL_HAVE_MISSING_ARGUMENT_MESSAGES.find(([role]) => role_is_missing_for_all(role, token))
		if (missing_role) {
			const [, message] = missing_role
			yield { error: message }
		} else {
			yield { error: "This use of '{stem}' does not match any sense in the Ontology. Check other errors and warnings for more information." }
			yield { info: 'For more detailed error messages, specify a sense (eg. {token}-A) and recheck.' }
		}

		// Some extra arguments are common mistakes and can be flagged even when no sense is specified
		for (const [extra_role_tag, extra_message] of ALL_HAVE_EXTRA_ARGUMENT_MESSAGES) {
			yield flag_extra_argument_for_all(extra_role_tag, extra_message)(trigger_context)
		}

		return
	}

	const selected_result = token.lookup_results[0]
	const case_frame = selected_result.case_frame

	if (!case_frame.is_valid) {
		yield { error: 'Incorrect usage of {sense}. Check other errors and warnings for more information, and consult the Ontology.' }
	}

	// Show errors for missing and unexpected arguments
	if (case_frame.missing_arguments.length) {
		// TODO add appropriate error tokens instead of putting all the messages on the verb
		const missing_messages = case_frame.missing_arguments.map(rule => rule.missing_message)
		for (const message of missing_messages) {
			yield { error: message }
		}
	}

	for (const extra_argument of case_frame.extra_arguments) {
		yield flag_extra_argument(trigger_context, extra_argument.rule.extra_message)(extra_argument)
	}
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
function no_matches_and_ambiguous_sense(token) {
	return !token.lookup_results.some(lookup => lookup.case_frame.is_valid) && token.lookup_results.length > 1 && !token.specified_sense
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @param {Token} token 
 * @returns {boolean}
 */
function role_is_missing_for_all(role_tag, token) {
	return token.lookup_results.every(LOOKUP_FILTERS.HAS_MISSING_ARGUMENT(role_tag))
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @param {Token} token 
 * @returns {boolean}
 */
function role_is_extra_for_all(role_tag, token) {
	return token.lookup_results.every(LOOKUP_FILTERS.HAS_EXTRA_ARGUMENT(role_tag))
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @param {string} message 
 * @returns {(trigger_context: RuleTriggerContext) => MessageInfo}
 */
function flag_extra_argument_for_all(role_tag, message) {
	return trigger_context => {
		const token = trigger_context.trigger_token
		const extra_argument = token.lookup_results[0].case_frame.extra_arguments.find(match => match.role_tag === role_tag)
		if (extra_argument && role_is_extra_for_all(role_tag, token)) {
			return flag_extra_argument(trigger_context, message)(extra_argument)
		}
		return {}
	}
}

/**
 * 
 * @param {RuleTriggerContext} trigger_context 
 * @param {string} message
 * @returns {(extra_argument: RoleMatchResult) => MessageInfo}
 */
function flag_extra_argument(trigger_context, message) {
	// The message is formatted based on the verb trigger token, not the argument token
	const formatted_message = format_token_message(trigger_context, message)

	return extra_argument => {
		const argument_token = extra_argument.trigger_context.trigger_token
		const token_to_flag = argument_token.type === TOKEN_TYPE.CLAUSE ? argument_token.sub_tokens[0] : argument_token
	
		if (['beneficiary', 'instrument'].includes(extra_argument.role_tag)) {
			// These arguments are not necessarily an error, as many verbs could technically take them.
			// Sometimes they just haven't occurred yet for a sense and so don't appear in the Verb categorization.
			// So show a warning instead of an error.
			return { token_to_flag, warning: formatted_message, plain: true }
		} else {
			return { token_to_flag, error: formatted_message, plain: true }
		}
	}
}
