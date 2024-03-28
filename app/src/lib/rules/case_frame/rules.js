import { create_context_filter, create_token_filter } from '../rules_parser'
import { check_verb_case_frames, check_verb_case_frames_passive } from './verbs'


/** @type {BuiltInRule[]} */
const case_frame_rules = [
	{
		name: 'Verb case frame, active',
		comment: 'For now, only trigger when not within a relative clause, question, or same-subject clause since arguments get moved around or are missing',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({
				'notprecededby': { 'tag': [{ 'syntax': 'relativizer|infinitive_same_subject' }, { 'auxiliary': 'passive' }], 'skip': 'all' },
				'notfollowedby': { 'token': '?', 'skip': 'all' },
			}),
			action: (tokens, trigger_index) => {
				check_verb_case_frames(tokens, trigger_index)
				return trigger_index + 1
			},
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
			action: (tokens, trigger_index) => {
				check_verb_case_frames_passive(tokens, trigger_index)
				return trigger_index + 1
			},
		},
	},
]

export const CASE_FRAME_RULES = case_frame_rules.map(({ rule }) => rule)