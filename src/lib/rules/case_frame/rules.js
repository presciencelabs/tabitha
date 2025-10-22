import { add_tag_to_token, is_one_part_of_speech, token_has_tag } from '$lib/token'
import { create_context_filter, create_token_filter, from_built_in_rule, simple_rule_action } from '$lib/rules/rules_parser'
import { select_pairing_sense, select_sense } from './sense_selection'
import { get_adjective_case_frame_rules } from './adjectives/case_frames'
import { get_verb_case_frame_rules, get_passive_verb_case_frame_rules } from './verbs/case_frames'
import { get_adposition_case_frame_rules } from './adpositions/case_frames'
import { initialize_case_frame_rules, check_case_frames, check_pairing_case_frames } from './common'
import { fill_relative_clause_gap, fill_same_subject_gap } from './gap_handling'


/** @type {BuiltInRule[]} */
const argument_and_sense_rules = [
	{
		name: 'Fill gap in same-subject clauses',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'patient_clause_same_participant|patient_clause_same_subject_passive|adverbial_clause_same_subject' } }),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token, rule_id }) => {
				fill_same_subject_gap(trigger_token.sub_tokens, rule_id)
			}),
		},
	},
	{
		name: 'Fill gap in relative clauses',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': { 'clause_type': 'relative_clause' } }),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token, rule_id }) => {
				fill_relative_clause_gap(trigger_token.sub_tokens, rule_id)
			}),
		},
	},
	{
		name: 'Initialize case frame rules and usage',
		comment: '',
		rule: {
			trigger: token => token.lookup_results.length > 0 && is_one_part_of_speech(token),
			context: create_context_filter({}),
			action: simple_rule_action(trigger_context => {
				const CASE_FRAME_RULE_GETTERS = new Map([
					['Verb', get_verb_case_frame_rules],
					['Adjective', get_adjective_case_frame_rules],
					['Adposition', get_adposition_case_frame_rules],
				])

				const part_of_speech = trigger_context.trigger_token.lookup_results[0].part_of_speech
				const case_frame_rule_getter = CASE_FRAME_RULE_GETTERS.get(part_of_speech)
				if (case_frame_rule_getter) {
					initialize_case_frame_rules(trigger_context, case_frame_rule_getter)
				}
			}),
		},
	},
	{
		name: 'Adjective case frames',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'category': 'Adjective' }),
			context: create_context_filter({}),
			action: simple_rule_action(check_case_frames),
		},
	},
	{
		name: 'Adjective sense selection',
		comment: 'Need to select the sense so that it transforms the adjective arguments before checking the Verb case frames',
		rule: {
			trigger: create_token_filter({ 'category': 'Adjective' }),
			context: create_context_filter({}),
			action: simple_rule_action(trigger_context => {
				select_sense(trigger_context)

				const token = trigger_context.trigger_token
				const selected_result = token.lookup_results[0]
				if (selected_result.case_frame.result.status === 'unchecked') {
					return
				}

				// An adjective being used predicatively should be tagged as such so the verb case frame rules can check it.
				// A verse reference is another special case that should not interfere with Verb case frames.
				const present_arguments = selected_result.case_frame.result.valid_arguments.map(arg => arg.role_tag)
				if (!(present_arguments.includes('modified_noun') || present_arguments.includes('modified_noun_with_subgroup'))
						&& !token_has_tag(token, { 'role': 'verse_ref' })) {
					add_tag_to_token(token, { 'adj_usage': 'predicative' }, trigger_context.rule_id)
				}
			}),
		},
	},
	{
		name: 'Verb case frame, active',
		comment: 'For now, only trigger when not within a question since arguments get moved around',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({
				'notprecededby': { 'tag': 'in_interrogative', 'skip': 'all' },
			}),
			action: simple_rule_action(check_case_frames),
		},
	},
	{
		name: 'Verb case frame, passive',
		comment: 'For now, only trigger when not within a question since arguments get moved around',
		rule: {
			trigger: token => create_token_filter({ 'category': 'Verb' })(token)
					&& token.lookup_results.some(({ case_frame }) => case_frame.result.status === 'invalid'),
			context: create_context_filter({
				'precededby': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
				'followedby': { 'tag': { 'pre_np_adposition': 'agent_of_passive' }, 'skip': 'all' },
				'notprecededby': { 'tag': 'in_interrogative', 'skip': 'all' },
			}),
			action: simple_rule_action(trigger_context => {
				initialize_case_frame_rules(trigger_context, get_passive_verb_case_frame_rules)
				check_case_frames(trigger_context)
			}),
		},
	},
	{
		name: 'Verb sense selection',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({}),
			action: simple_rule_action(select_sense),
		},
	},
	{
		name: 'Adposition case frames',
		comment: "Need to do this after Adjectives and Verbs so that argument-related adpositions don't get checked.",
		rule: {
			trigger: create_token_filter({ 'category': 'Adposition' }),
			context: create_context_filter({}),
			action: simple_rule_action(check_case_frames),
		},
	},
	{
		name: 'Other word sense selection',
		comment: 'Adjective and Verb senses have already been selected',
		rule: {
			trigger: token => token.lookup_results.length > 0
					&& is_one_part_of_speech(token)
					&& !create_token_filter({ 'category': 'Adjective|Verb' })(token),
			context: create_context_filter({}),
			action: simple_rule_action(select_sense),
		},
	},
	{
		name: 'Pairing compatibility and sense selection',
		comment: '',
		rule: {
			trigger: token => token.pairing !== null,
			context: create_context_filter({}),
			action: simple_rule_action(trigger_context => {
				if (trigger_context.trigger_token.lookup_results.at(0)?.case_frame.result.status === 'valid') {
					check_pairing_case_frames(trigger_context)
				}
				select_pairing_sense(trigger_context)
			}),
		},
	},
]

export const ARGUMENT_AND_SENSE_RULES = argument_and_sense_rules.map(from_built_in_rule('case_frame'))