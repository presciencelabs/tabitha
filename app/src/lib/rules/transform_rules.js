import {TOKEN_TYPE} from '../parser/token'
import {parse_transform_rule} from './rules_parser'

/**
 * TODO store these in the database
 * These are words that may change their underlying data based on the context around them.
 * In future, these could look at the lookup results of the surrounding tokens (ie syntactic category)
 * and could be used to decide between senses.
 */
const transform_rules_json = [
	{
		'name': 'do with not becomes a function word',
		'trigger': { 'token': 'do|does|did|Do' },
		'context': {
			'followedby': { 'token': 'not' }
		},
		'transform': { 'type': TOKEN_TYPE.FUNCTION_WORD }
	},
	{
		'name': 'because of becomes because-B',
		'trigger': { 'token': 'because' },
		'context': {
			'followedby': { 'token': 'of' }
		},
		'transform': { 'lookup': 'because-B' }
	},
]

export const TRANSFORM_RULES = transform_rules_json.map(parse_transform_rule)
