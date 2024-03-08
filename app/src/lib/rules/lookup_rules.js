import {apply_token_transforms, create_context_filter, create_token_filter, create_token_transform} from '$lib/rules/rules_parser'
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
		'name': 'so-that becomes so for lookup purposes',
		'trigger': { 'token': 'so-that' },
		'lookup': 'so',
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
		'trigger': { 'token': 'Even|even' },
		'context': { 'followedby': {'token': 'if'} },
		'lookup': 'even-if',
		'combine': 1,
	},
	{
		'name': 'much becomes much-many if followed by a Noun',
		'trigger': { 'token': 'Much|much' },
		'context': { 'followedby': {'category': 'Noun'} },
		'lookup': 'much-many',
		'comment': 'something like "There is much water"',
	},
	{
		'name': 'many becomes much-many',
		'trigger': { 'token': 'Many|many' },
		'lookup': 'much-many',
	},
	{
		'name': 'every becomes each',
		'trigger': { 'token': 'Every|every' },
		'lookup': 'each',
	},
	{
		'name': 'half becomes .5',
		'trigger': { 'token': 'half' },
		'lookup': '.5',
	},
	{
		'name': 'one tenth of',
		'trigger': { 'token': 'One|one' },
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

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_lookup_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])

	const lookup_term = rule_json['lookup']
	const combine = rule_json['combine'] ?? 0

	// TODO support multiple transforms if context requires multiple tokens
	const context_transforms = [create_token_transform(rule_json['context_transform'])]

	return {
		trigger,
		context,
		action: lookup_rule_action,
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {number} trigger_index 
	 * @param {number[]} context_indexes 
	 * @returns {number}
	 */
	function lookup_rule_action(tokens, trigger_index, context_indexes) {
		tokens[trigger_index] = {...tokens[trigger_index], lookup_term}

		if (context_indexes.length === 0) {
			return trigger_index + 1
		}

		// apply possible context transforms
		apply_token_transforms(tokens, context_indexes, context_transforms)

		if (combine === 0 || context_indexes[combine-1] !== trigger_index + combine) {
			return trigger_index + 1
		}
		
		// combine context tokens into one
		const tokens_to_combine = tokens.splice(trigger_index, combine + 1)
		const new_token_value = tokens_to_combine.map(token => token.token).join(' ')
		tokens.splice(trigger_index, 0, {...tokens_to_combine[0], token: new_token_value})
		return trigger_index + combine + 1
	}
}

export const LOOKUP_RULES = lookup_rules_json.map(parse_lookup_rule)