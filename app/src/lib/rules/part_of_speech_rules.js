import { ERRORS } from '$lib/parser/error_messages'
import { create_context_filter, create_token_filter, create_token_modify_action } from './rules_parser'

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
		'name': 'If Noun-Verb followed by article or demonstrative, remove the Noun',
		'category': 'Noun|Verb',
		'context': {
			'followedby': {
				'tag': 'indefinite_article|definite_article|near_demonstrative|remote_demonstrative',
				'skip': { 'category': 'Adjective' },
			},
		},
		'remove': 'Noun',
		'comment': 'Daniel 1:5 The king allowed the men to drink(N/V) the king\'s wine.',
	},
	{
		'name': 'If Noun-Verb preceded by Negative Verb Polarity or Modal words, delete the Noun',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'tag': 'negative_verb_polarity|modal' },
		},
		'remove': 'Noun',
		'comment': 'I will judge(N/V). I do not judge(N/V). I should judge(N/V). etc',
	},
	{
		'name': 'If Noun-Verb preceded by Verb, Adjective, Conjunction, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'category': 'Verb|Adjective|Conjunction' },
		},
		'remove': 'Verb',
		'comment': 'Preceded by a Verb: Daniel 3:2 people that collect tax(N/V)... Preceded by an Adjective: Daniel 1:7 The official gave new names(N/V) to the men... Preceded by a Conjunction: Because we don\'t allow coordinate VPs in these propositions, if there\'s a Conjunction preceding the Noun/Verb, the word must be a Noun. Daniel 2:37 God has given wealth and honor(N/V) to you.',
	},
	{
		'name': 'If Noun-Verb preceded by certain Adpositions, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'stem': 'from|of|with' },
		},
		'remove': 'Verb',
		'comment': '',
	},
	{
		'name': 'If Noun-Verb preceded by an \'s, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'tag': 'genitive_saxon', 'skip': 'adjp_attributive' },
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
		'name': 'If Adposition-Conjunction is the first word of a sentence, remove Adposition',
		'category': 'Adposition|Conjunction',
		'trigger': { 'tag': 'first_word', 'stem': 'so' },
		'remove': 'Adposition',
		'comment': 'only for \'so\'. \'for\' might be the \'for each...\' sense',
	},
	{
		'name': '\'so-that\' will always be the Adposition',
		'category': 'Adposition|Conjunction',
		'trigger': { 'token': 'so-that' },
		'remove': 'Conjunction',
		'comment': '',
	},
	{
		'name': 'If \'so\' is at the start of a subordinate clause, remove the Conjunction',
		'category': 'Adposition|Conjunction',
		'trigger': { 'stem': 'so' },
		'context': {
			'precededby': { 'token': '[' },
		},
		'remove': 'Conjunction',
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
		'name': 'If Adverb-Adjective followed by Verb, remove Adjective',
		'category': 'Adverb|Adjective',
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'remove': 'Adjective',
		'comment': 'John only(Adv/Adj) saw a book.',
	},
	{
		'name': 'If Noun-Adjective followed by Noun, remove Noun',
		'category': 'Noun|Adjective',
		'context': {
			'followedby': { 'category': 'Noun', 'skip': 'adjp_attributive' },
		},
		'remove': 'Noun',
		'comment': 'Daniel 7:4 I saw the second(N/Adj) animal. The chief(N/Adj) evil spirit.',
	},
	{
		'name': 'If Noun-Adjective is preceded by an article but not followed by Noun, remove Adjective',
		'category': 'Noun|Adjective',
		'context': {
			'precededby': {
				'tag': 'indefinite_article|definite_article|near_demonstrative|remote_demonstrative|negative_noun_polarity',
				'skip': 'adjp_attributive',
			},
			'notfollowedby': { 'category': 'Noun', 'skip': 'adjp_attributive' },
		},
		'remove': 'Adjective',
		'comment': 'John knew about the secret(N/Adj).',
	},
	{
		'name': 'If Noun-Adjective followed by Verb, remove Adjective',
		'category': 'Noun|Adjective',
		'context': {
			'followedby': { 'category': 'Verb' },
		},
		'remove': 'Noun',
		'comment': 'Daniel 3:4 The one official(N/Adj) shouted ...',
	},
	{
		'name': 'If Noun-Adjective preceded by \'be\' or \'feel\', remove Noun',
		'category': 'Noun|Adjective',
		'context': {
			'precededby': { 'category': 'Verb', 'stem': 'be|feel', 'skip': ['vp_modifiers', 'adjp_modifiers_predicative'] },
		},
		'remove': 'Noun',
		'comment': "Infected Eye 1:1 Melissa's eye is sore(N/Adj).  Infected Eye 1:15 Janet's eyes were still sore(N/Adj).",
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
		'comment': 'The man held the stick in the man\'s left(V/Adj) hand',
	},
	{
		'name': 'If Verb-Adjective preceded by a degree indicator, remove Verb',
		'category': 'Verb|Adjective',
		'context': {
			'precededby': {
				'tag': 'intensified_degree|extremely_intensified_degree|least_degree|comparative_degree|too_degree',
			},
		},
		'remove': 'Verb',
		'comment': 'Daniel 3:24  Nebuchadnezzar was very surprised(V/Adj).',
	},
	{
		'name': 'If Verb-Adjective preceded by a Noun, remove Adjective',
		'category': 'Verb|Adjective',
		'context': { 'precededby': { 'category': 'Noun' } },
		'remove': 'Adjective',
		'comment': 'The man left the house.',
	},
	{
		'name': '\'pleased\' followed by \'with\' is the Adjective',
		'category': 'Verb|Adjective',
		'trigger': { 'token': 'pleased' },
		'context': { 'followedby': { 'token': 'with' } },
		'remove': 'Verb',
		'comment': 'Luke 3:22 I am pleased(V/Adj) with you.',
	},
	{
		'name': 'If Adjective-Adverb followed by Noun, remove the Adverb',
		'category': 'Adverb|Adjective',
		'context': {
			'followedby': { 'category': 'Noun' },
		},
		'remove': 'Adverb',
		'comment': 'Dan. 1:12 Please give only(Adj/Adv) vegetables ...',
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
	{
		'name': 'If Adverb-Adposition followed by a Noun, delete the Adverb',
		'category': 'Adverb|Adposition',
		'context': {
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
		},
		'remove': 'Adverb',
		'comment': 'Daniel 1:1 when(Adv/Adp) Jehoiakim ... 3:5 when(Adv/Adp) the people hear ...',
	},
	{
		'name': 'If Verb-Adposition precededby by a modal or \'not\', delete the Adposition',
		'category': 'Verb|Adposition',
		'context': {
			'precededby': { 'tag': 'modal|negative_verb_polarity', 'skip': 'vp_modifiers' },
		},
		'remove': 'Adposition',
		'comment': 'John should like(V/Adp) that book.',
	},
	{
		'name': 'If Verb-Adposition at the beginning of a clause, delete the Verb',
		'category': 'Verb|Adposition',
		'context': {
			'precededby': { 'token': '[', 'skip': { 'category': 'Conjunction' } },
		},
		'remove': 'Verb',
		'comment': 'Daniel 2:40  The fourth kingom will be strong [like(V/Adp) iron is strong].',
	},
]

/** @type {BuiltInRule[]} */
const builtin_part_of_speech_rules = [
	{
		name: "Words with possessive 's must be a noun",
		comment: '',
		rule: {
			trigger: token => token.tag.includes('genitive_saxon'),
			context: create_context_filter({}),
			action: create_token_modify_action(keep_parts_of_speech(new Set(['Noun']))),
		},
	},
	{
		name: 'Words with a pronoun must be a noun.',
		comment: '',
		rule: {
			trigger: token => token.pronoun !== null,
			context: create_context_filter({}),
			action: create_token_modify_action(keep_parts_of_speech(new Set(['Noun']))),
		},
	},
	{
		name: 'Filter lookup results for pairings based on part of speech',
		comment: '',
		rule: {
			trigger: token => !!(token.lookup_results.length && token.complex_pairing?.lookup_results.length),
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				/** @type {Token[]} */
				// @ts-ignore
				const [left, right] = [token, token.complex_pairing]

				// filter lookup results based on the overlap of the two concepts
				const left_categories = new Set(left.lookup_results.map(result => result.part_of_speech))
				const right_categories = new Set(right.lookup_results.map(result => result.part_of_speech))
				const overlapping_categories = new Set([...left_categories].filter(x => right_categories.has(x)))

				if (overlapping_categories.size > 0) {
					const category_filter = keep_parts_of_speech(overlapping_categories)
					category_filter(left)
					category_filter(right)
				} else {
					left.error_message = ERRORS.PAIRING_DIFFERENT_PARTS_OF_SPEECH
				}
			}),
		},
	},
]

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_part_of_speech_rule(rule_json) {
	const category = category_filter(rule_json['category'])
	const trigger = create_token_filter(rule_json['trigger']) 
	const context = create_context_filter(rule_json['context'])
	const action = create_remove_action(rule_json['remove'])

	return {
		trigger: token => category(token) && trigger(token),
		context,
		action,
	}

	/**
	 * 
	 * @param {string} categories_json 
	 * @returns {TokenFilter}
	 */
	function category_filter(categories_json) {
		// the token must have at least one result from each given category
		const categories = categories_json.split('|')
		return token => categories.every(category => token.lookup_results.some(result => result.part_of_speech === category))
	}

	/**
	 * 
	 * @param {string} remove_json
	 * @returns {RuleAction}
	 */
	function create_remove_action(remove_json) {
		const remove_action = remove_part_of_speech(remove_json)

		return create_token_modify_action(token => {
			remove_action(token)

			if (token.complex_pairing) {
				remove_action(token.complex_pairing)
			}
		})
	}
}

export const PART_OF_SPEECH_RULES = builtin_part_of_speech_rules.map(({ rule }) => rule)
	.concat(part_of_speech_rules_json.map(parse_part_of_speech_rule))

/**
 * 
 * @param {Set<string>} parts_of_speech 
 * @returns {(token: Token) => void}
 */
function keep_parts_of_speech(parts_of_speech) {
	return token => token.lookup_results = token.lookup_results.filter(result => parts_of_speech.has(result.part_of_speech))
}

/**
 * 
 * @param {string} part_of_speech
 * @returns {(token: Token) => void}
 */
function remove_part_of_speech(part_of_speech) {
	return token => token.lookup_results = token.lookup_results.filter(result => result.part_of_speech !== part_of_speech)
}