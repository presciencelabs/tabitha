import {apply_token_transforms, create_context_filter, create_token_filter, create_token_transform} from './rules_parser'

/**
 * These are words that may change their underlying data based on the context around them.
 * These can look at the lookup results of the surrounding tokens (ie syntactic category)
 * and can be used to decide between senses.
 * 
 * TODO Move the sense-determining/case frame rules to a different file and/or create a different type of rule for them
 * 
 */
const transform_rules_json = [
	{
		'name': 'do with not becomes a function word',
		'trigger': { 'stem': 'do' },
		'context': {
			'followedby': { 'token': 'not' },
		},
		'transform': { 'function': 'auxiliary' },
	},
	{
		'name': 'do in a question becomes an auxiliary',
		'trigger': { 'stem': 'do' },
		'context': {
			'followedby': [{ 'category': 'Verb', 'skip': 'all' }, { 'token': '?', 'skip': 'all' }],
		},
		'transform': { 'function': 'auxiliary' },
	},
	{
		'name': 'most before adjective or adverb becomes a function word',
		'trigger': { 'stem': 'most' },
		'context': {
			'followedby': { 'category': 'Adjective|Adverb' },
		},
		'transform': { 'function': 'superlative_degree' },
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
		'transform': { 'function': 'auxiliary|inceptive_aspect' },
		'comment': 'support both "started eating" and "started to eat"',
	},
	{
		'name': 'stop before a verb becomes a function word',
		'trigger': { 'stem': 'stop' },
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'transform': { 'function': 'auxiliary|cessative_aspect' },
	},
	{
		'name': 'continue before a verb becomes a function word',
		'trigger': { 'stem': 'continue' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'skip': { 'token': 'to' },
			},
		},
		'transform': { 'function': 'auxiliary|continuative_aspect' },
		'comment': 'support both "continued eating" and "continued to eat"',
	},
	{
		'name': 'finish before a verb becomes a function word',
		'trigger': { 'stem': 'finish' },
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'transform': { 'function': 'auxiliary|completive_aspect' },
	},
	{
		'name': '\'named\' before a name and after a Verb becomes a function word',
		'trigger': { 'token': 'named' },
		'context': {
			'precededby': { 'category': 'Verb', 'skip': 'all' },
			'followedby': { 'level': '4' },
		},
		'transform': { 'function': '-Name' },
	},
	{
		'name': '\'named\' before a name and before a Verb becomes a function word',
		'trigger': { 'token': 'named' },
		'context': {
			'followedby': [{ 'level': '4' }, { 'category': 'Verb', 'skip': 'all' }],
		},
		'transform': { 'function': '-Name' },
	},
	{
		'name': '\'of\' after group/crowd becomes a function word',
		'trigger': { 'token': 'of' },
		'context': { 'precededby': {'stem': 'group|crowd'} },
		'transform': { 'function': '-Group' },
	},
	{
		'name': '\'that\' followed by the Adposition \'so\' does not have any function',
		'trigger': { 'token': 'that' },
		'context': {
			'precededby': {'stem': 'so', 'category': 'Adposition'},
		},
		'transform': { 'tag': '' },
		'comment': 'both "so that" and "so-that" are supported and map to the Adposition "so"',
	},
	{
		'name': 'Adposition \'so\' followed by \'would\' becomes so-C',
		'trigger': { 'stem': 'so', 'category': 'Adposition' },
		'context': {
			'followedby': { 'tag': 'conditional_would', 'skip': 'all' },
		},
		'transform': { 'concept': 'so-C' },
	},
	{
		'name': 'be after \'there\' becomes be-E (existential)',
		'trigger': { 'stem': 'be' },
		'context': {
			'precededby': { 'token': 'There|there' },
		},
		'transform': { 'concept': 'be-E' },
		'context_transform': { 'function': 'existential' },
	},
	{
		'name': 'be before \'like\' becomes be-U',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': [
				{ 'token': 'like', 'skip': {'token': 'not'} },
			],
		},
		'transform': { 'concept': 'be-U' },
		'context_transform': { 'function': 'state_role' },
	},
	{
		'name': 'be before \'for\' becomes be-G',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': { 'token': 'for', 'skip': {'token': 'not'} },
		},
		'transform': { 'concept': 'be-G' },
		'context_transform': { 'function': 'state_role' },
	},
	{
		'name': 'be before \'with\' becomes be-I',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': { 'token': 'with', 'skip': {'token': 'not'} },
		},
		'transform': { 'concept': 'be-I' },
		'context_transform': { 'function': 'state_role' },
	},
	{
		'name': 'be before \'about\' becomes be-P',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': { 'token': 'about', 'skip': {'token': 'not'} },
		},
		'transform': { 'concept': 'be-P' },
		'context_transform': { 'function': 'state_role' },
	},
	{
		'name': 'be before an adposition and temporal words becomes be-H',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': [
				{ 'stem': 'in|on|before|after' },
				{ 'stem': 'day|morning|afternoon|evening|Sabbath', 'skip': [{'token': 'the'}, {'category': 'Adjective'}] },
			],
		},
		'transform': { 'concept': 'be-H' },
	},
	{
		'name': 'be before an adposition becomes be-F',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Adposition',
				'usage': 'A|a',
				'skip': [{ 'token': 'not' }, { 'category': 'Adverb'}],
			},
		},
		'transform': { 'concept': 'be-F' },
	},
	{
		'name': 'be after \'date\' becomes be-J',
		'trigger': { 'stem': 'be' },
		'context': {
			'precededby': { 'token': 'date' },
		},
		'transform': { 'concept': 'be-J' },
	},
	{
		'name': 'be after \'time\' becomes be-N',
		'trigger': { 'stem': 'be' },
		'context': {
			'precededby': { 'token': 'time' },
		},
		'transform': { 'concept': 'be-N' },
		'context_transform': { 'concept': 'time-A' },
	},
	{
		'name': 'be after \'weather\' becomes be-O',
		'trigger': { 'stem': 'be' },
		'context': {
			'precededby': { 'token': 'weather' },
		},
		'transform': { 'concept': 'be-O' },
	},
	{
		'name': 'be after the noun \'name\' becomes be-K',
		'trigger': { 'stem': 'be' },
		'context': {
			'precededby': { 'category': 'Noun', 'stem': 'name', 'skip': 'all' },
		},
		'transform': { 'concept': 'be-K' },
	},
	{
		'name': 'be before an adjective becomes be-D if can be used predicatively',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Adjective',
				'skip': [{ 'token': 'not|very|extremely' }, { 'category': 'Adverb' }],
			},
		},
		'transform': { 'concept': 'be-D' },
	},
	{
		'name': 'become before an adjective becomes become-A',
		'trigger': { 'stem': 'become' },
		'context': {
			'followedby': {
				'category': 'Adjective',
				'skip': { 'token': 'very|extremely' },
			},
		},
		'transform': { 'concept': 'become-A' },
	},
	{
		'name': 'be before any verb becomes an auxiliary',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'transform': { 'function': 'auxiliary' },
		'comment': 'the more precise function may be ambiguous e.g. "was cry-out"',
	},
	{
		'name': 'be before a past participle Verb indicates passive',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'past participle',
				'skip': [{ 'token': 'not' }, { 'category': 'Adverb'}],
			},
		},
		'transform': { 'function': 'auxiliary|passive' },
	},
	{
		'name': 'be before a participle Verb indicates imperfective',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'participle',
				'skip': [{ 'token': 'not' }, { 'category': 'Adverb'}],
			},
		},
		'transform': { 'function': 'auxiliary|imperfective_aspect' },
	},
	{
		'name': 'have before a Verb indicates flashback/perfect',
		'trigger': { 'stem': 'have' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'skip': [{ 'token': 'not' }, { 'category': 'Adverb'}],
			},
		},
		'transform': { 'function': 'auxiliary|flashback' },
		'comment': 'don\'t check for the past participle form because of cases like "have cry-out"',
	},
	{
		'name': 'be before an auxiliary becomes an auxiliary',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'tag': 'auxiliary',
				'skip': [{ 'token': 'not' }, { 'category': 'Adverb'}],
			},
		},
		'transform': { 'function': 'auxiliary' },
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
	{
		'name': 'Select Adverbial senses of adpositions when first word of a subordinate clause',
		'trigger': { 'category': 'Adposition' },
		'context': {
			'precededby': {'token': '['},
		},
		'transform': { 'usage': 'C' },
		'comment': 'C means "Always in an Adverbial clause". eg by-A (Adverbial - C) vs by-B (Adjunct - A)',
	},
]

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_transform_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])
	const transform = create_token_transform(rule_json['transform'])

	// TODO support multiple transforms if context requires multiple tokens
	const context_transforms = [create_token_transform(rule_json['context_transform'])]

	return {
		trigger,
		context,
		action: transform_rule_action,
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {number} trigger_index 
	 * @param {number[]} context_indexes 
	 * @returns {number}
	 */
	function transform_rule_action(tokens, trigger_index, context_indexes) {
		const transforms = [transform, ...context_transforms]
		const indexes = [trigger_index, ...context_indexes]
		apply_token_transforms(tokens, indexes, transforms)
		return trigger_index + 1
	}
}

export const TRANSFORM_RULES = transform_rules_json.map(parse_transform_rule)
