import { TOKEN_TYPE, concept_with_sense, create_case_frame, format_token_message } from '$lib/parser/token'
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
	return messages.get(role_tag) ?? `Couldn't find the ${role_tag} for this {category}.`
}

/**
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function extra_argument_message(role_tag) {
	const consult_message = "Consult the {category}'s Theta Grid usage."
	const messages = new Map([
		['patient', `Unexpected ${role_tag} for {sense}. ${consult_message}`],
		['source', `Unexpected ${role_tag} for {sense}. ${consult_message}`],
		['destination', `Unexpected ${role_tag} for {sense}. ${consult_message}`],
		['beneficiary', `{sense} does not usually take a ${role_tag}. Check to make sure its usage is acceptable.`],
		['instrument', `{sense} does not usually take a ${role_tag}. Check to make sure its usage is acceptable.`],
		['agent_clause', `{sense} cannot be used with an agent clause. ${consult_message}`],
		['patient_clause_different_participant', `{sense} cannot be used with a different-participant patient clause. ${consult_message}`],
		['patient_clause_same_participant', `{sense} cannot be used with a same-participant patient clause. ${consult_message}`],
		['patient_clause_simultaneous', `{sense} cannot be used with a simultaneous perception clause. ${consult_message}`],
		['patient_clause_quote_begin', `{sense} cannot be used with direct speech. ${consult_message}`],
		['predicate_adjective', `{sense} cannot be used with a predicate Adjective. ${consult_message}`],
	])

	return messages.get(role_tag) ?? `Unexpected ${role_tag} for {sense}. Consult its usage in the Ontology.`
}

/** @type {[RoleTag, string][]} */
const ALL_HAVE_EXTRA_ARGUMENT_MESSAGES = [
	['patient_clause_same_participant', 'Unexpected patient clause for {category} \'{stem}\'. This likely should be \'[in-order-to...]\' or \'[so-that...]\' instead.'],
	['patient_clause_quote_begin', '\'{stem}\' can never be used with direct speech. Consult its usage in the Ontology.'],
	['predicate_adjective', '\'{stem}\' can never be used with a predicate adjective. Consider using something like \'cause [X to be...]\'. Consult its usage in the Ontology.'],
]

/** @type {Map<string, any>} */
const SENSE_RULE_PRESETS = new Map([
	['patient_from_subordinate_clause', {
		'patient': {
			'by_clause_tag': 'patient_clause_different_participant',
			'missing_message': "{sense} should be written in the format 'X {stem} [Y to Verb]'.",
		},
		'other_rules': {
			'extra_patient': {
				'directly_after_verb': { },
				'extra_message': "{sense} should not be written with the patient. Use the format 'X {stem} [Y to Verb]'.",
			},
		},
		'comment': 'the patient is omitted in the phase 1 and copied from within the subordinate. so treat the clause like the patient',
	}],
])

/** @type {[string, (preset_value: any, role_tag: RoleTag) => any][]} */
// @ts-ignore the map initializer array doesn't like the different object structures
const ROLE_RULE_PRESETS = [
	['by_adposition', (preset_value, role_tag) => ({
		'trigger': { 'tag': { 'syntax': 'head_np' } },
		'context': { 'precededby': { 'token': preset_value, 'skip': 'np_modifiers' } },
		'context_transform': { 'function': '' },
		'missing_message': `Couldn't find the ${role_tag}, which in this case should have '${preset_value}' before it.`,
	})],
	['by_clause_tag', preset_value => ({
		'trigger': { 'type': TOKEN_TYPE.CLAUSE, 'tag': { 'clause_type': preset_value } },
	})],
	['directly_before_verb', preset_value => ({
		'trigger': { 'tag': { 'syntax': 'head_np' }, ...preset_value },
		'context': { 'followedby': { 'category': 'Verb', 'skip': ['np_modifiers', 'vp_modifiers'] } },
	})],
	['directly_after_verb', preset_value => ({
		'trigger': { 'tag': { 'syntax': 'head_np' }, ...preset_value },
		'context': { 'precededby': { 'category': 'Verb', 'skip': ['vp_modifiers', 'np_modifiers'] } },
	})],
	['directly_after_verb_with_adposition', (preset_value, role_tag) => ({
		'trigger': { 'tag': { 'syntax': 'head_np' } },
		'context': {
			'precededby': [
				{ 'category': 'Verb', 'skip': 'vp_modifiers' },
				{ 'token': preset_value, 'skip': 'np_modifiers' },
			],
		},
		'context_transform': [{}, { 'function': '' }],
		'missing_message': `Couldn't find the ${role_tag}, which in this case should have '${preset_value}' before it.`,
	})],
	['predicate_adjective', () => ({
		'trigger': { 'category': 'Adjective', 'tag': { 'syntax': 'predicate_adjective' } },
	})],
]

/**
 * 
 * @param {[RoleTag, any]} rule_json 
 * @returns {ArgumentRoleRule[]}
 */
export function parse_case_frame_rule([role_tag, rule_json]) {
	if (Array.isArray(rule_json)) {
		// An argument role may have multiple possible trigger rules, ie different structures that are allowed.
		return rule_json.flatMap(rule_option => parse_case_frame_rule([role_tag, rule_option]))
	}

	const preset = ROLE_RULE_PRESETS.find(([key]) => key in rule_json)
	if (preset) {
		const [preset_tag, preset_rule] = preset
		const preset_value = rule_json[preset_tag]
		rule_json = {
			...preset_rule(preset_value, role_tag),
			...rule_json,		// allow a rule to overwrite or add any part of a preset
		}
	}

	// An empty object means no rule applies. Since a valid rule always needs a trigger, this test works
	if (!('trigger' in rule_json)) {
		return []
	}

	rule_json['transform'] = { 'tag': { 'role': role_tag }, ...rule_json['transform'] ?? {} }

	return [{
		role_tag,
		trigger_rule: parse_transform_rule(rule_json),
		missing_message: rule_json['missing_message'] ?? missing_argument_message(role_tag),
		extra_message: rule_json['extra_message'] ?? '',
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
			rules_json = SENSE_RULE_PRESETS.get(rules_json) ?? rules_json

			const role_rules = defaults.flatMap(rule => rule.role_tag in rules_json ? parse_case_frame_rule([rule.role_tag, rules_json[rule.role_tag]]) : [rule])

			const other_rules = 'other_rules' in rules_json ? Object.entries(rules_json['other_rules']).flatMap(parse_case_frame_rule) : []

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
 * 
 * @param {RuleTriggerContext} trigger_context
 * @param {Object} rule_info
 * @param {ArgumentRulesForSense[]} [rule_info.rules_by_sense] 
 * @param {ArgumentRoleRule[]} [rule_info.default_rules] 
 * @param {Map<string, RoleTag>} [rule_info.role_letter_map] 
 */
export function check_case_frames({ tokens, trigger_token }, { rules_by_sense=[], default_rules=[], role_letter_map=new Map() }) {
	const pipeline = pipe(
		get_rules_for_sense(rules_by_sense, default_rules),
		match_sense_rules(tokens),
		check_usage(role_letter_map),
	)

	for (const lookup of trigger_token.lookup_results.filter(result => result.concept)) {
		lookup.case_frame = pipeline(lookup)
	}
}

/**
 * 
 * @param {ArgumentRulesForSense[]} rules_by_sense 
 * @param {ArgumentRoleRule[]} default_rules
 * @returns {(lookup: LookupResult) => [LookupResult, ArgumentRulesForSense]}
 */
function get_rules_for_sense(rules_by_sense, default_rules) {
	const defaults_for_stem = {
		rules: default_rules,
		other_optional: [],
		other_required: [],
		patient_clause_type: '',
	}
	return lookup => {
		const sense = lookup.concept ? concept_with_sense(lookup.concept) : lookup.stem
		return [lookup, rules_by_sense.find(rule => rule.sense === sense) ?? { sense, ...defaults_for_stem }]
	}
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {(param: [LookupResult, ArgumentRulesForSense]) => [LookupResult, ArgumentRulesForSense, RoleMatchResult[]]}
 */
function match_sense_rules(tokens) {
	return ([lookup, sense_rule]) => [lookup, sense_rule, sense_rule.rules.map(rule => match_argument_rule(tokens, rule)).filter(match => match.success)]
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {ArgumentRoleRule} rule 
 * @returns {RoleMatchResult}
 */
function match_argument_rule(tokens, rule) {
	const { trigger, context } = rule.trigger_rule

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
		return {
			role_tag: rule.role_tag,
			success: true,
			trigger_context: {
				tokens,
				trigger_index: i,
				trigger_token: tokens[i],
				...context_result,
			},
			rule,
		}
	}
	return {
		role_tag: rule.role_tag,
		success: false,
		trigger_context: {
			tokens: [],
			trigger_index: -1,
			trigger_token: tokens[0],
			context_indexes: [],
			subtoken_indexes: [],
		},
		rule,
	}
}

/**
 * @param {Map<string, RoleTag>} role_letter_map
 * @returns {(param: [LookupResult, ArgumentRulesForSense, RoleMatchResult[]]) => CaseFrameResult}
 */
function check_usage(role_letter_map) {
	return ([lookup, role_rules, role_matches]) => {
		if (lookup.concept === null) {
			return create_case_frame({ is_valid: false, is_checked: false })
		}

		const role_letters = [...lookup.concept.categorization].filter(c => c !== '_')

		// Replace 'patient_clause' with the appropriate clause type
		const patient_clause_type = role_rules.patient_clause_type || 'patient_clause_different_participant'

		/** @type {string[]} */
		// @ts-ignore
		const possible_roles = role_letters
			.map(c => role_letter_map.get(c.toUpperCase()))
			.map(role => role === 'patient_clause' ? patient_clause_type : role)
			.concat([...role_rules.other_optional, ...role_rules.other_required])
			.filter(role => role)

		/** @type {string[]} */
		// @ts-ignore
		const required_roles = role_letters
			.map(c => role_letter_map.get(c))
			.map(role => role === 'patient_clause' ? patient_clause_type : role)
			.concat(role_rules.other_required)
			.filter(role => role)

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
		if (role_is_missing_for_all('agent', token)) {
			// If no sense could find an agent (or agent_clause), there's probably a bracketing issue. Make the message more clear.
			// This will likely be a common occurrence and so can be handled specially.
			yield { error: 'No agent could be found for this verb. Make sure to add explicit agents for imperatives and passives, and make sure your brackets are correct.' }

		} else {
			yield { error: 'No senses match the argument structure found in this sentence. Specify a sense (eg. {token}-A) to get more info about its expected structure.' }
		}

		// Some extra arguments are common mistakes and can be flagged even when no sense is specified
		for (const [extra_role_tag, extra_message] of ALL_HAVE_EXTRA_ARGUMENT_MESSAGES) {
			yield flag_extra_argument_for_all(extra_role_tag, extra_message)(trigger_context)
		}

		return
	}

	const selected_result = token.lookup_results[0]
	const case_frame = selected_result.case_frame

	// Show errors for missing and unexpected arguments
	if (case_frame.missing_arguments.length) {
		// TODO add appropriate error tokens instead of putting all the messages on the verb
		const missing_messages = case_frame.missing_arguments.map(rule => rule.missing_message)
		yield { error: `${missing_messages.join(' | ')} Consult the Ontology for correct usage.` }
	}

	for (const extra_argument of case_frame.extra_arguments) {
		const message = extra_argument.rule.extra_message || extra_argument_message(extra_argument.role_tag)
		yield flag_extra_argument(trigger_context, message)(extra_argument)
	}
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
function no_matches_and_ambiguous_sense(token) {
	return !token.lookup_results.some(result => result.case_frame.is_valid) && token.lookup_results.length > 1 && !token.specified_sense
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @param {Token} token 
 * @returns {boolean}
 */
function role_is_missing_for_all(role_tag, token) {
	return token.lookup_results.every(result => result.case_frame.missing_arguments.some(rule => rule.role_tag.includes(role_tag)))
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @param {Token} token 
 * @returns {boolean}
 */
function role_is_extra_for_all(role_tag, token) {
	return token.lookup_results.every(result => result.case_frame.extra_arguments.some(match => match.role_tag.includes(role_tag)))
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
			// So show a suggest message (or info message??) instead of an error.
			return { token_to_flag, suggest: formatted_message, plain: true }
		} else {
			return { token_to_flag, error: formatted_message, plain: true }
		}
	}
}