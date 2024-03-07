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
		'name': 'have before a past participle Verb indicates flashback/perfect',
		'trigger': { 'stem': 'have' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'past participle',
				'skip': [{ 'token': 'not' }, { 'category': 'Adverb'}],
			},
		},
		'transform': { 'function': 'auxiliary|flashback' },
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
		'name': 'be before an adjective becomes be-D',
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
		'name': 'be after \'there\' becomes be-E (existential)',
		'trigger': { 'stem': 'be' },
		'context': {
			'precededby': { 'token': 'There|there' },
		},
		'transform': { 'concept': 'be-E' },
		'context_transform': { 'function': 'existential' },
	},
]

export const TRANSFORM_RULES = transform_rules_json.map(parse_transform_rule)
