import { ERRORS } from '$lib/parser/error_messages'
import { create_context_filter, create_token_filter, message_set_action, simple_rule_action } from './rules_parser'
import { TOKEN_TYPE, create_lookup_result } from '$lib/parser/token'

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
				'tag': 'determiner',
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
				'tag': 'determiner',
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
			'precededby': { 'tag': 'verb_polarity|modal' },
		},
		'remove': 'Noun',
		'comment': 'I will judge(N/V). I do not judge(N/V). I should judge(N/V). etc',
	},
	{
		'name': 'If Noun-Verb preceded by an aspectual auxiliary, remove Adjective',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'stem': 'start|begin|stop|continue|finish', 'skip': { 'token': 'to' } },
		},
		'remove': 'Noun',
		'comment': 'People will continue to hope(N/V) in Christ Jesus.',
	},
	{
		'name': 'If Noun-Verb preceded by Adjective or Conjunction, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'category': 'Adjective|Conjunction' },
		},
		'remove': 'Verb',
		'comment': 'Preceded by an Adjective: Daniel 1:7 The official gave new names(N/V) to the men... Preceded by a Conjunction: Because we don\'t allow coordinate VPs in these propositions, if there\'s a Conjunction preceding the Noun/Verb, the word must be a Noun. Daniel 2:37 God has given wealth and honor(N/V) to you.',
	},
	{
		'name': 'If Noun-Verb preceded by certain Adpositions, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'token': 'from|with' },
		},
		'remove': 'Verb',
		'comment': '',
	},
	{
		'name': 'If Noun-Verb preceded by a relation, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'tag': 'relation', 'skip': 'adjp_attributive' },
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
		'name': 'If Noun-Verb followed by a Noun, delete the Noun',
		'category': 'Noun|Verb',
		'context': {
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
			'notfollowedby': { 'token': 'of' },
		},
		'remove': 'Noun',
		'comment': '"The people [that are in the tribe named Levi] saw(N/V) Mary." This only works because cases like "the judge\'s(N/V) house" are handled earlier.',
	},
	{
		'name': 'If Noun-Verb preceded by Verb, delete the Verb',
		'category': 'Noun|Verb',
		'context': {
			'precededby': { 'category': 'Verb' },
		},
		'remove': 'Verb',
		'comment': 'Preceded by a Verb: Daniel 3:2 people that collect tax(N/V)... Sometimes wrongly selects Noun when preceded by "be": You(people) should be teaching(N/V) other people about those things. (not sure how to fix this without breaking other cases)',
	},
	{
		'name': 'If Adposition-Conjunction is the first word of a sentence, remove Adposition',
		'category': 'Adposition|Conjunction',
		'trigger': { 'tag': { 'position': 'first_word' }, 'stem': 'so' },
		'remove': 'Adposition',
		'comment': 'only for \'so\'. \'for\' might be the \'for each...\' sense',
	},
	{
		'name': 'If "so/for" appears anywhere else in the sentence, remove Conjunction',
		'category': 'Adposition|Conjunction',
		'trigger': { 'token': 'so|for' },
		'remove': 'Conjunction',
		'comment': 'This relies on the fact these conjunctions must be the first word and therefore capitalized',
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
		'name': 'If chief is followed by a common ambiguous Noun, remove the Noun',
		'category': 'Noun|Adjective',
		'trigger': { 'stem': 'chief' },
		'context': {
			'followedby': { 'stem': 'stone|guard|judge' },
		},
		'remove': 'Noun',
		'comment': 'Jesus is-X the chief(N/Adj) stone(N/V). stone, judge, guard, etc will not be disambiguated properly otherwise',
	},
	{
		'name': 'If Noun-Adjective preceded by Adjective, remove Adjective',
		'category': 'Noun|Adjective',
		'context': {
			'precededby': { 'category': 'Adjective' },
		},
		'remove': 'Adjective',
		'comment': "eg. Daniel 1:3 'royal offical(N/Adj)'. eg. 'And God lives in extremely bright light(N/Adj).' This rule must be after the 'remove Noun if followed by a Noun' rule",
	},
	{
		'name': 'If Noun-Adjective is preceded by an article but not followed by Noun, remove Adjective',
		'category': 'Noun|Adjective',
		'context': {
			'precededby': {
				'tag': 'determiner',
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
				'tag': ['determiner', { 'relation': 'genitive_saxon' }],
				'skip': { 'category': 'Adjective' },
			},
		},
		'remove': 'Verb',
		'comment': 'The man held the stick in the (man\'s) left(V/Adj) hand',
	},
	{
		'name': 'If Verb-Adjective followed by an article/demonstrative, remove Adjective',
		'category': 'Verb|Adjective',
		'context': {
			'followedby': { 'tag': 'determiner', 'skip': 'vp_modifiers' },
		},
		'remove': 'Adjective',
		'comment': 'Some people have left(V/Adj) the faith.',
	},
	{
		'name': 'If Verb-Adjective preceded by an aspectual auxiliary, remove Adjective',
		'category': 'Verb|Adjective',
		'context': {
			'precededby': { 'stem': 'start|begin|stop|continue|finish', 'skip': { 'token': 'to' } },
		},
		'remove': 'Adjective',
		'comment': 'Some people have stopped following(V/Adj) Christ Jesus.',
	},
	{
		'name': 'If Verb-Adjective preceded by a degree indicator, remove Verb',
		'category': 'Verb|Adjective',
		'context': {
			'precededby': { 'tag': 'degree' },
		},
		'remove': 'Verb',
		'comment': 'Daniel 3:24  Nebuchadnezzar was very surprised(V/Adj).',
	},
	{
		'name': 'If Verb-Adjective "long" preceded by a unit of length, remove Verb',
		'category': 'Verb|Adjective',
		'trigger': { 'token': 'long' },
		'context': { 'precededby': { 'stem': 'meter|kilometer|cubit' } },
		'remove': 'Verb',
		'comment': 'The boat was 200 meters long(V/Adj/Adv).',
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
		'name': 'If amazed/surprised NOT followed by any Noun, remove the Verb',
		'category': 'Verb|Adjective',
		'trigger': { 'token': 'amazed|surprised|surprised-B' },
		'context': { 'notfollowedby': { 'category': 'Noun', 'skip': 'all' } },
		'remove': 'Verb',
		'comment': 'The people were amazed(V/Adj). The people were amazed(V/Adj) [Jesus said those things].',
	},
	{
		'name': 'If amazed/surprised IS followed by any Noun, remove the Adjective',
		'category': 'Verb|Adjective',
		'trigger': { 'token': 'amazed|surprised' },
		'context': { 'followedby': { 'category': 'Noun', 'skip': 'all' } },
		'remove': 'Adjective',
		'comment': 'The people were amazed(V/Adj) by Jesus\' words.',
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
		'name': 'If Adverb-Adjective "long" preceded by the verb be, remove Adverb',
		'category': 'Adverb|Adjective',
		'trigger': { 'token': 'long' },
		'context': { 'precededby': { 'category': 'Verb', 'stem': 'be', 'skip': 'all' } },
		'remove': 'Adverb',
		'comment': 'The boat was 200 meters long(V/Adj/Adv).',
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
		'name': "If 'close' is followed by 'to', remove the Verb",
		'category': 'Verb|Adposition',
		'trigger': { 'token': 'close to' },
		'remove': 'Verb',
		'comment': 'e.g. Peter sat close(Adp/Adj/Verb) to the fire. A lookup rule combined "close" and "to"',
	},
	{
		'name': 'If Verb-Adposition precededby by a modal or \'not\', delete the Adposition',
		'category': 'Verb|Adposition',
		'context': {
			'precededby': { 'tag': 'modal|verb_polarity', 'skip': 'vp_modifiers' },
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
			trigger: create_token_filter({ 'tag': { 'relation': 'genitive_saxon' } }),
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token }) => keep_parts_of_speech(new Set(['Noun']))(trigger_token)),
		},
	},
	{
		name: 'Words with a pronoun must be a noun.',
		comment: '',
		rule: {
			trigger: token => token.pronoun !== null,
			context: create_context_filter({}),
			action: simple_rule_action(({ trigger_token }) => keep_parts_of_speech(new Set(['Noun']))(trigger_token)),
		},
	},
	{
		name: 'Filter lookup results for pairings based on part of speech',
		comment: '',
		rule: {
			trigger: token => !!(token.lookup_results.length && token.complex_pairing?.lookup_results.length),
			context: create_context_filter({}),
			action: message_set_action(({ trigger_token: token }) => {
				/** @type {Token[]} */
				// @ts-ignore there will always be a pairing at this point
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
					return { error: ERRORS.PAIRING_DIFFERENT_PARTS_OF_SPEECH }
				}
			}),
		},
	},
	{
		name: 'Select part-of-speech based on a note',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD,
			context: create_context_filter({ 'followedby': { 'token': '_noun|_verb|_adj|_adv|_adp|_conj' } }),
			action: simple_rule_action(({ trigger_token, tokens, context_indexes }) => {
				const part_of_speech_note = tokens[context_indexes[0]].token
				const part_of_speech = new Map([
					['_noun', 'Noun'],
					['_verb', 'Verb'],
					['_adj', 'Adjective'],
					['_adv', 'Adverb'],
					['_adp', 'Adposition'],
					['_conj', 'Conjunction'],
				]).get(part_of_speech_note) ?? ''

				keep_parts_of_speech(new Set([part_of_speech]))(trigger_token)

				// if no results remain, add a dummy one so the word acts like that part-of-speech
				if (trigger_token.lookup_results.length === 0) {
					trigger_token.lookup_results.push(create_lookup_result({ stem: trigger_token.token, part_of_speech }))
				}
			}),
		},
	},
	{
		name: 'Disambiguate part-of-speech based on the selected sense',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && token.specified_sense.length > 0,
			context: create_context_filter({}),
			action: message_set_action(({ trigger_token: token }) => {
				if (token.lookup_results.every(result => result.part_of_speech.toLowerCase() === token.lookup_results[0].part_of_speech.toLowerCase())) {
					return {}
				}

				// get all results that match the specified sense
				const parts_of_speech_for_sense = new Set(token.lookup_results
					.filter(result => result.concept?.sense === token.specified_sense)
					.map(result => result.part_of_speech))

				if (parts_of_speech_for_sense.size > 0) {
					keep_parts_of_speech(parts_of_speech_for_sense)(token)
				} else {
					return { warning: `No sense '${token.specified_sense}' was found for this word in any part-of-speech.` }
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
	const trigger = create_token_filter(rule_json['trigger'] ?? 'all') 
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

		return simple_rule_action(({ trigger_token }) => {
			remove_action(trigger_token)

			if (trigger_token.complex_pairing) {
				remove_action(trigger_token.complex_pairing)
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
