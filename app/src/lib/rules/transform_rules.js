import {TOKEN_TYPE} from '../parser/token'
import {parse_transform_rule} from './rules_parser'

/**
 * These are words that may change their underlying data based on the context around them.
 * These can look at the lookup results of the surrounding tokens (ie syntactic category)
 * and can be used to decide between senses.
 */
const transform_rules_json = [
	{
		'name': 'do with not becomes a function word',
		'trigger': { 'stem': 'do' },
		'context': {
			'followedby': { 'token': 'not' },
		},
		'transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'start before a verb becomes a function word',
		'trigger': { 'stem': 'start' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'skip': { 'token': 'to' },
			},
		},
		'transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'continue before a verb becomes a function word',
		'trigger': { 'stem': 'continue' },
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'finish before a verb becomes a function word',
		'trigger': { 'stem': 'finish' },
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'be before an adjective becomes be-D',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Adjective',
				'skip': { 'token': 'not|very|extremely' },
			},
		},
		'transform': { 'concept': 'be-D' },
	},
	{
		'name': 'be before a past participle Verb indicates passive',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'past participle',
				'skip': { 'category': 'Adverb' },
			},
		},
		'transform': { 'function': 'passive' },
	},
	{
		'name': 'by preceded by a passive be indicates the agent',
		'trigger': { 'stem': 'by' },
		'context': {
			'precededby': {
				'tag': 'passive',
				'skip': 'all',
			},
		},
		'transform': { 'function': 'agent_of_passive' },
	},
]

export const TRANSFORM_RULES = transform_rules_json.map(parse_transform_rule)
