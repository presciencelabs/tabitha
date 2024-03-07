import {parse_part_of_speech_rule} from './rules_parser'

/**
 * These rules are designed to disambiguate words that could be multiple parts of speech.
 * E.g. guard(N/V), command(N/V), pleased(V/Adj), well(N/Adj/Adv)
 * The Analyzer has many of these, but this is just a few for now.
 * TODO add more rules
 */
const part_of_speech_rules_json = [
	{
		'name': 'If Noun-Verb preceded by article or demonstrative, remove the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': {
				'tag': 'indefinite_article|definite_article|near_demonstrative|remote_demonstrative',
				'skip': { 'category': 'Adjective' },
			},
		},
		'remove': 'Verb',
		'comment': 'Definite Article: Daniel 3:4 I will read the command(N/V). Indefinite Article: Daniel 3:10 The king made a command(N/V). Near Demonstrative: Daniel 3:11 People who do not obey this command(N/V)... Remote Demonstrative: Daniel 5:17 You may give those rewards(N/V) to another person.  Remote-Demonstrative-Relativizer-Complmentizer:  Daniel 1:11 Daniel spoke to that guard(N/V).',
	},
	{
		'name': 'If Noun-Verb preceded by Negative Verb Polarity, delete the Noun',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'tag': 'negative_verb_polarity' },
		},
		'remove': 'Noun',
	},
	{
		'name': 'If Noun-Verb preceded by Verb, Adjective, Conjunction, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'category': 'Verb|Adjective|Conjunction' },
		},
		'remove': 'Noun',
		'comment': 'Preceded by a Verb: Daniel 3:2 people that collect tax(N/V)... Preceded by an Adjective: Daniel 1:7 The official gave new names(N/V) to the men... Preceded by a Conjunction: Because we don\'t allow coordinate VPs in these propositions, if there\'s a Conjunction preceding the Noun/Verb, the word must be a Noun. Daniel 2:37 God has given wealth and honor(N/V) to you.',
	},
	{
		'name': 'If Noun-Verb preceded by certain adpositions, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'stem': 'from|of|with' },
		},
		'remove': 'Noun',
		'comment': '',
	},
	{
		'name': 'If Noun-Verb preceded by an \'s, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'tag': 'genitive_saxon', 'skip': { 'category': 'Adjective' } },
		},
		'remove': 'Verb',
		'comment': 'Gideon returned to the Israelite\'s camp.',
	},
	{
		'name': 'If Noun-Verb preceded by a Noun, delete the Noun',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'category': 'Noun' },
		},
		'remove': 'Noun',
		'comment': 'Daniel 3:9  I(astrologer) hope(N/V) that...',
	},
	{
		'name': 'If Adposition-Conjunction at the beginning of a non-relative clause, remove Adposition',
		'category': 'Adposition|Conjunction',
		'context': {
			'notprecededby': { 'token': '[' },
		},
		'remove': 'Adposition',
		'comment': '',
	},
	{
		'name': 'If Adverb-Adjective followed by Noun, remove Adverb',
		'category': 'Adverb|Adjective',
		'context': {
			'followedby': { 'category': 'Noun' },
		},
		'remove': 'Adverb',
		'comment': 'Dan. 1:12 Please give only(Adj/Adv) vegetables ...  Paul like most(Adj/Adv) books.',
	},
	{
		'name': 'If Verb-Adjective preceded by an article or possessive, remove Verb',
		'category': 'Verb|Adjective',
		'context': {
			'precededby': {
				'tag': 'indefinite_article|definite_article|near_demonstrative|remote_demonstrative|genitive_saxon',
				'skip': { 'category': 'Adjective' },
			},
		},
		'remove': 'Verb',
		'comment': 'The man held the stick in the man\'s left hand',
	},
	{
		'name': 'If Verb-Adjective preceded by a Noun, remove Adjective',
		'category': 'Verb|Adjective',
		'context': { 'precededby': { 'category': 'Noun' } },
		'remove': 'Adjective',
		'comment': 'The man left the house.',
	},
	{
		'name': 'If Adverb-Adjective followed by Verb, remove Adjective',
		'category': 'Adverb|Adjective',
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'remove': 'Adjective',
		'comment': 'Infected Eye 1:5  You must first(Adj/Adv) wash ...',
	},
]

export const PART_OF_SPEECH_RULES = part_of_speech_rules_json.map(parse_part_of_speech_rule)