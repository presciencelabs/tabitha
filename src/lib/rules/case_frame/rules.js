import { add_tag_to_token, is_one_part_of_speech, token_has_tag } from '$lib/parser/token'
import { create_context_filter, create_token_filter, simple_rule_action } from '../rules_parser'
import { select_sense } from './sense_selection'
import { check_adjective_case_frames } from './adjectives'
import { check_verb_case_frames, check_verb_case_frames_passive } from './verbs'
import { check_adposition_case_frames } from './adpositions'


/** @type {BuiltInRule[]} */
const argument_and_sense_rules = [
	{
		name: 'Adjective case frames',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'category': 'Adjective' }),
			context: create_context_filter({}),
			action: simple_rule_action(check_adjective_case_frames),
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

				// An adjective being used predicatively should be tagged as such so the verb case frame rules can check it.
				// A verse reference is another special case that should not interfere with Verb case frames.
				if (!selected_result.case_frame.valid_arguments.map(arg => arg.role_tag).includes('modified_noun')
						&& !token_has_tag(token, { 'role': 'verse_ref' })) {
					add_tag_to_token(token, { 'adj_usage': 'predicative' })
				}
			}),
		},
	},
	{
		name: 'Verb case frame, active',
		comment: 'For now, only trigger when not within a relative clause, question, or same-subject clause since arguments get moved around or are missing',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({
				'notprecededby': { 'tag': [{ 'syntax': 'relativizer|infinitive_same_subject' }, { 'auxiliary': 'passive' }], 'skip': 'all' },
				'notfollowedby': { 'token': '?', 'skip': 'all' },
			}),
			action: simple_rule_action(check_verb_case_frames),
		},
	},
	{
		name: 'Verb case frame, passive',
		comment: 'For now, only trigger when not within a relative clause or a question since arguments get moved around or are missing',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({
				'precededby': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
				'notprecededby': { 'tag': { 'syntax': 'relativizer|infinitive_same_subject' }, 'skip': 'all' },
				'notfollowedby': { 'token': '?', 'skip': 'all' },
			}),
			action: simple_rule_action(check_verb_case_frames_passive),
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
		comment: `Need to do this after Adjectives and Verbs so that no argument-related adpositions don\'t get checked.
			Also skip relative clauses because there may be a dangling adposition (eg. 'place [that John lived at]'`,
		rule: {
			trigger: create_token_filter({ 'category': 'Adposition' }),
			context: create_context_filter({
				'notprecededby': { 'tag': { 'syntax': 'relativizer' }, 'skip': 'all' },
			}),
			action: simple_rule_action(check_adposition_case_frames),
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
]

export const ARGUMENT_AND_SENSE_RULES = argument_and_sense_rules.map(({ rule }) => rule)