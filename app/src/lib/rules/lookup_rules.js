import {parse_lookup_rule} from '$lib/rules/rules_parser'
import {TOKEN_TYPE} from '../parser/token'

/**
 * These words/phrases (and some others) are accepted by the Analyzer as alternates for
 * certain words in the Ontology.
 */
const lookup_rules_json = [
	{
		'name': 'in-order-to',
		'trigger': { 'token': 'in' },
		'context': { 'followedby': [{'token': 'order'}, {'token': 'to'}] },
		'lookup': 'in-order-to',
		'combine': 2,
	},
	{
		'name': 'in-front-of',
		'trigger': { 'token': 'in' },
		'context': { 'followedby': [{'token': 'front'}, {'token': 'of'}] },
		'lookup': 'in-front-of',
		'combine': 2,
	},
	{
		'name': 'so-that',
		'trigger': { 'token': 'so' },
		'context': { 'followedby': {'token': 'that'} },
		'lookup': 'so-that',
		'combine': 1,
	},
	{
		'name': 'just-like',
		'trigger': { 'token': 'just' },
		'context': { 'followedby': {'token': 'like'} },
		'lookup': 'just-like',
		'combine': 1,
	},
	{
		'name': 'even-if',
		'trigger': { 'token': 'even' },
		'context': { 'followedby': {'token': 'if'} },
		'lookup': 'even-if',
		'combine': 1,
	},
	{
		'name': 'much becomes much-many',
		'trigger': { 'token': 'much' },
		'lookup': 'much-many',
	},
	{
		'name': 'many becomes much-many',
		'trigger': { 'token': 'many' },
		'lookup': 'much-many',
	},
	{
		'name': 'every becomes each',
		'trigger': { 'token': 'every' },
		'lookup': 'each',
	},
	{
		'name': 'half becomes .5',
		'trigger': { 'token': 'half' },
		'lookup': '.5',
	},
	{
		'name': 'one tenth of',
		'trigger': { 'token': 'one' },
		'context': { 'followedby': [{'token': 'tenth'}, {'token': 'of'}] },
		'lookup': '.1',
		'combine': 2,
	},
	{
		'name': 'because of becomes because-B',
		'trigger': { 'token': 'because' },
		'context': { 'followedby': {'token': 'of'} },
		'lookup': 'because-B',
		'combine': 1,
	},
	{
		'name': 'come out',
		'trigger': { 'stem': 'come' },
		'context': { 'followedby': {'token': 'out'} },
		'lookup': 'come-out',
		'combine': 1,
	},
	{
		'name': 'cry out',
		'trigger': { 'stem': 'cry' },
		'context': { 'followedby': {'token': 'out'} },
		'lookup': 'cry-out',
		'combine': 1,
	},
	{
		'name': 'give birth',
		'trigger': { 'stem': 'give' },
		'context': { 'followedby': {'token': 'birth'} },
		'lookup': 'birth',
		'combine': 1,
	},
	{
		'name': 'put on (clothes)',
		'trigger': { 'stem': 'put' },
		'context': { 'followedby': [{'token': 'on'}, {'stem': 'clothes|glove|sandal|shirt|shoe'}] },
		'lookup': 'put-on',
		'combine': 1,
		'comment': 'The clothing-related nouns must be present because we don\'t want this rule applying to \'put on\' in general',
	},
	{
		'name': 'take away',
		'trigger': { 'stem': 'take' },
		'context': { 'followedby': {'token': 'away', 'skip': 'all'} },
		'lookup': 'take-away',
		'context_transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
]

export const LOOKUP_RULES = lookup_rules_json.map(parse_lookup_rule)