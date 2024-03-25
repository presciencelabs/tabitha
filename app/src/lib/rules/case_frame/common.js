import { TOKEN_TYPE, concept_with_sense, create_case_frame } from '$lib/parser/token'
import { pipe } from '$lib/pipeline'
import { apply_token_transforms, create_context_filter, create_token_filter, create_token_transform, create_token_transforms } from '../rules_parser'

/**
 * 
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function missing_argument_message(role_tag) {
	const messages = new Map([
		['agent_clause', "And agent clause is required (e.g. 'It Verb [X...]' or '[X...] Verb...')."],
		['patient_clause_quote_begin', 'A direct-speech patient clause is required.'],
		['patient_clause_different_participant', 'A different-participant patient clause is required (i.e. the clause subject must be explicit).'],
		['patient_clause_same_participant', "A same-participant patient clause is required (e.g. '... [to sing]')."],
		['patient_clause_simultaneous', "A simultaneous perception clause is required (e.g. 'John saw [Mary singing]')."],
	])
	return messages.get(role_tag) ?? `A ${role_tag} is required.`
}

/**
 * 
 * @param {OntologyResult} concept
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function extra_argument_message(concept, role_tag) {
	const sense = concept_with_sense(concept)
	const category = concept.part_of_speech
	const consult_message = `Consult the ${category}'s Theta Grid usage.`
	const messages = new Map([
		['patient', `Unexpected ${role_tag} for ${sense}. ${consult_message}`],
		['source', `Unexpected ${role_tag} for ${sense}. ${consult_message}`],
		['destination', `Unexpected ${role_tag} for ${sense}. ${consult_message}`],
		['beneficiary', `${sense} does not usually take a ${role_tag}. Check to make sure its usage is acceptable.`],
		['instrument', `${sense} does not usually take a ${role_tag}. Check to make sure its usage is acceptable.`],
		['agent_clause', `${sense} cannot be used with an agent clause. ${consult_message}`],
		['patient_clause_different_participant', `${sense} cannot be used with a different-participant patient clause. ${consult_message}`],
		['patient_clause_same_participant', `${sense} cannot be used with a same-participant patient clause. ${consult_message}`],
		['patient_clause_simultaneous', `${sense} cannot be used with a simultaneous perception clause. ${consult_message}`],
		['patient_clause_quote_begin', `${sense} cannot be used with direct speech. ${consult_message}`],
		['predicate_adjective', `${sense} cannot be used with a predicate Adjective. ${consult_message}`],
	])

	return messages.get(role_tag) ?? `Unexpected ${role_tag} for ${sense}. Consult its usage in the Ontology.`
}

/**
 * 
 * @param {[RoleTag, any]} rule_json 
 * @returns {ArgumentRoleRule}
 */
export function parse_case_frame_rule([role_tag, rule_json]) {
	const by_adposition = rule_json['by_adposition']
	if (by_adposition) {
		rule_json = {
			'trigger': { 'tag': 'head_np' },
			'context': { 'precededby': { 'token': by_adposition, 'skip': 'np_modifiers' } },
			'context_transform': { 'function': '' },
			'missing_message': `A ${role_tag} argument is required, which for this verb must be preceded by '${by_adposition}'.`,
			...rule_json,		// allow a rule to overwrite or add any part of this
		}
	}

	const by_clause_tag = rule_json['by_clause_tag']
	if (by_clause_tag) {
		rule_json = {
			'trigger': { 'type': TOKEN_TYPE.CLAUSE, 'tag': by_clause_tag },
			...rule_json,		// allow a rule to overwrite or add any part of this
		}
	}

	const directly_before_verb = rule_json['directly_before_verb']
	if (directly_before_verb) {
		rule_json = {
			'trigger': { 'tag': 'head_np', ...directly_before_verb },
			'context': { 'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' } },
			...rule_json,		// allow a rule to overwrite or add any part of this
		}
	}

	const directly_after_verb = rule_json['directly_after_verb']
	if (directly_after_verb) {
		rule_json = {
			'trigger': { 'tag': 'head_np', ...directly_after_verb },
			'context': { 'precededby': { 'category': 'Verb', 'skip': ['vp_modifiers', 'np_modifiers'] } },
			...rule_json,		// allow a rule to overwrite or add any part of this
		}
	}

	const directly_after_verb_with_adposition = rule_json['directly_after_verb_with_adposition']
	if (directly_after_verb_with_adposition) {
		rule_json = {
			'trigger': { 'tag': 'head_np' },
			'context': {
				'precededby': [
					{ 'category': 'Verb', 'skip': 'vp_modifiers' },
					{ 'token': directly_after_verb_with_adposition, 'skip': 'np_modifiers' },
				],
			},
			'context_transform': [{}, { 'function': '' }],
			'missing_message': `A ${role_tag} is required, which for this verb must be preceded by '${directly_after_verb_with_adposition}'.`,
			...rule_json,		// allow a rule to overwrite or add any part of this
		}
	}

	const predicate_adjective = rule_json['predicate_adjective']
	if (predicate_adjective) {
		rule_json = {
			'trigger': { 'category': 'Adjective', 'tag': 'predicate_adjective' },
			...rule_json,		// allow a rule to overwrite or add any part of this
		}
	}

	const trigger_json = rule_json['trigger']
	const trigger = trigger_json ? create_token_filter(trigger_json) : () => false

	const context = create_context_filter(rule_json['context'])

	const transform = create_token_transform({ 'tag': role_tag, ...rule_json['transform'] ?? {} })
	const context_transforms = create_token_transforms(rule_json['context_transform'])
	const missing_message = rule_json['missing_message'] ?? missing_argument_message(role_tag)

	return {
		role_tag,
		trigger,
		context,
		action: case_frame_rule_action,
		missing_message,
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {RoleMatchResult} role_match 
	 */
	function case_frame_rule_action(tokens, { trigger_index, context_indexes }) {
		const transforms = [transform, ...context_transforms]
		const indexes = [trigger_index, ...context_indexes]
		apply_token_transforms(tokens, indexes, transforms)
	}
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
		return ([sense, rules_json]) => ({
			sense,
			rules: defaults.map(rule => rule.role_tag in rules_json ? parse_case_frame_rule([rule.role_tag, rules_json[rule.role_tag]]) : rule),
			other_optional: rules_json['other_optional']?.split('|') ?? [],
			other_required: rules_json['other_required']?.split('|') ?? [],
			patient_clause_type: rules_json['patient_clause_type'] ?? '',
		})
	}
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} trigger_index 
 * @param {Object} rule_info
 * @param {ArgumentRulesForSense[]} [rule_info.rules_by_sense] 
 * @param {ArgumentRoleRule[]} [rule_info.default_rules] 
 * @param {Map<string, RoleTag>} [rule_info.role_letter_map] 
 */
export function check_case_frames(tokens, trigger_index, { rules_by_sense=[], default_rules=[], role_letter_map=new Map() }) {
	const pipeline = pipe(
		get_rules_for_sense(rules_by_sense, default_rules),
		match_sense_rules(tokens),
		check_usage(role_letter_map),
	)

	for (const lookup of tokens[trigger_index].lookup_results.filter(result => result.concept)) {
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
	for (let i = 0; i < tokens.length;) {
		if (!rule.trigger(tokens[i])) {
			i++
			continue
		}
		const context_result = rule.context(tokens, i)
		if (!context_result.success) {
			i++
			continue
		}
		return {
			role_tag: rule.role_tag,
			success: true,
			trigger_index: i,
			context_indexes: context_result.indexes,
		}
	}
	return {
		role_tag: rule.role_tag,
		success: false,
		trigger_index: -1,
		context_indexes: [],
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
		const missing_arguments = required_roles.filter(role => !role_matches.some(({ role_tag }) => role_tag === role))
		const is_valid = extra_arguments.length === 0 && missing_arguments.length === 0

		return create_case_frame({
			is_valid,
			is_checked: true,
			valid_arguments,
			missing_arguments,
			extra_arguments,
			rule: role_rules,
		})
	}
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} trigger_index 
 */
export function validate_case_frame(tokens, trigger_index) {
	const token = tokens[trigger_index]

	if (token.lookup_results.length > 1 && !token.lookup_results.some(result => result.case_frame.is_valid)) {
		token.error_message = 'No senses match the argument structure found in this sentence. Specify a sense to get more info about its expected structure.'
		return
	}

	const selected_result = token.lookup_results[0]
	const case_frame = selected_result.case_frame

	// Show errors for missing and unexpected arguments
	if (case_frame.missing_arguments.length) {
		const missing_messages = case_frame.missing_arguments
			.map(role_tag => case_frame.rule.rules.find(rule => rule.role_tag === role_tag))
			.map(rule => rule?.missing_message)
		
		// TODO add appropriate error tokens instead of putting all the messages on the verb
		token.error_message = `${missing_messages.join(' | ')} Consult the Ontology for correct usage.`
	}

	for (const extra_argument of case_frame.extra_arguments) {
		const argument_token = tokens[extra_argument.trigger_index]
		const token_to_flag = argument_token.type === TOKEN_TYPE.CLAUSE ? argument_token.sub_tokens[0] : argument_token

		// @ts-ignore there will always be a concept
		const message = extra_argument_message(selected_result.concept, extra_argument.role_tag)

		if (['beneficiary', 'instrument'].includes(extra_argument.role_tag)) {
			// These arguments are not necessarily an error, as many verbs could technically take them.
			// Sometimes they just haven't occurred yet for a sense and so don't appear in the Verb categorization.
			// So show a suggest message (or info message??) instead of an error.
			token_to_flag.suggest_message = message
		} else {
			token_to_flag.error_message = message
		}
	}
}