import { apply_token_transforms, create_context_filter, create_token_filter, create_token_modify_action, create_token_transform, create_token_transforms } from './rules_parser'

/**
 * These are words that may change their underlying data based on the context around them.
 * These can look at the lookup results of the surrounding tokens (ie syntactic category).
 */
const transform_rules_json = [
	{
		'name': '"to" before a verb gets tagged as infinitive',
		'trigger': { 'token': 'to' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': 'infinitive' },
	},
	{
		'name': 'start or begin before a verb becomes a function word',
		'trigger': { 'stem': 'start|begin' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': 'auxiliary|inceptive_aspect' },
		'comment': 'support both "started eating" and "started to eat"',
	},
	{
		'name': 'stop before a verb becomes a function word',
		'trigger': { 'stem': 'stop' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': 'auxiliary|cessative_aspect' },
	},
	{
		'name': 'continue before a verb becomes a function word',
		'trigger': { 'stem': 'continue' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': 'auxiliary|continuative_aspect' },
		'comment': 'support both "continued eating" and "continued to eat"',
	},
	{
		'name': 'finish before a verb becomes a function word',
		'trigger': { 'stem': 'finish' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': 'auxiliary|completive_aspect' },
	},
	{
		'name': 'tag subordinate clauses starting with an adposition as adverbial',
		'trigger': { 'tag': 'subordinate_clause' },
		'context': { 'subtokens': { 'category': 'Adposition', 'skip': { 'token': '[' } } },
		'transform': { 'tag': 'adverbial_clause' },
	},
	{
		'name': 'tag subordinate clauses along with \'it\' as agent clauses',
		'trigger': { 'tag': 'subordinate_clause' },
		'context': { 'precededby': { 'tag': 'agent_proposition_subject', 'skip': 'all' } },
		'transform': { 'tag': 'agent_clause' },
		'comment': 'Ruth 2:22 It is good that you continue working...',
	},
	{
		'name': 'tag subordinate clauses that directly precede the verb as agent clauses',
		'trigger': { 'tag': 'subordinate_clause' },
		'context': { 'followedby': { 'category': 'Verb' } },
		'transform': { 'tag': 'agent_clause' },
		'comment': 'It is true that John read that book',
	},
	{
		'name': 'tag \'that\' relative clauses that occur with \'it\' as agent clauses',
		'trigger': { 'tag': 'relative_clause_that' },
		'context': {
			'precededby': { 'tag': 'agent_proposition_subject', 'skip': ['np', 'vp'] },
		},
		'transform': { 'tag': 'agent_clause' },
		'comment': 'It please Mary [that John read this book]. - this was originally tagged as a relative clause but the \'it\' takes priority',
	},
	{
		'name': 'tag subordinate clauses starting with the infinitive \'to\' as \'same_participant\'',
		'trigger': { 'tag': 'subordinate_clause' },
		'context': { 'subtokens': { 'tag': 'infinitive', 'skip': { 'token': '[' } } },
		'transform': { 'tag': 'patient_clause_same_participant' },
	},
	{
		'name': 'tag subordinate clauses where the verb is a participle for see/hear',
		'trigger': { 'tag': 'subordinate_clause' },
		'context': {
			'precededby': { 'category': 'Verb', 'stem': 'see|hear', 'skip': 'all' },
			'subtokens': {
				'category': 'Verb',
				'form': 'stem|participle',
				'skip': 'all',
			},
		},
		'transform': { 'tag': 'patient_clause_simultaneous|patient_clause_different_participant' },
		'comment': 'eg. "John saw [Mary walking]." This rule should apply before setting "be" as an auxilliary, but after setting the aspect verbs as auxilliaries',
	},
	{
		'name': 'any remaining subordinate_clause is a \'different_participant\' patient clause by default',
		'trigger': { 'tag': 'subordinate_clause' },
		'transform': { 'tag': 'patient_clause_different_participant' },
	},
	{
		'name': '"no" before a noun becomes negative_noun_polarity',
		'trigger': { 'token': 'no' },
		'context': { 'followedby': { 'category': 'Noun', 'skip': { 'category': 'Adjective' } } },
		'transform': { 'function': 'negative_noun_polarity' },
	},
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
		'context': { 'precededby': { 'stem': 'group|crowd' } },
		'transform': { 'function': '-Group' },
	},
	{
		'name': '\'that\' followed by the Adposition \'so\' does not have any function',
		'trigger': { 'token': 'that' },
		'context': {
			'precededby': { 'stem': 'so', 'category': 'Adposition' },
		},
		'transform': { 'tag': '' },
		'comment': 'both "so that" and "so-that" are supported and map to the Adposition "so"',
	},
	{
		'name': '\'who\'/\'what\' gets tagged with interrogative_which when in a question',
		'trigger': { 'token': 'Who|who|What|what' },
		'context': {
			'followedby': { 'token': '?', 'skip': 'all' },
		},
		'transform': { 'tag': 'interrogative_which' },
		'comment': '"who/what" becomes "which person-A/thing-A" respectively when in a question',
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
		'name': 'Tag \'there\' before \'be\' as existential',
		'trigger': { 'token': 'There|there' },
		'context': {
			'followedby': { 'stem': 'be' },
		},
		'transform': { 'function': 'existential' },
		'comment': 'We have to keep this as a transform rule so we can handle the "there" properly.',
	},
	{
		'name': '\'part\' after \'be\' becomes a function word',
		'trigger': { 'token': 'part' },
		'context': {
			'precededby': { 'stem': 'be', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': '' },
		'comment': 'Since \'part\' is also a noun, this ensures the right head noun is found for be-R',
	},
	{
		'name': '\'made of\' after \'be\' becomes a function word',
		'trigger': { 'token': 'made' },
		'context': {
			'precededby': { 'stem': 'be', 'skip': 'vp_modifiers' },
			'followedby': { 'token': 'of' },
		},
		'transform': { 'function': '' },
		'comment': 'The Analyzer always fully deletes the phrase "made of", but we can be more specific',
	},
	{
		'name': 'be before a past participle Verb indicates passive',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'past participle',
				'skip': 'vp_modifiers',
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
				'skip': 'vp_modifiers',
			},
		},
		'transform': { 'function': 'auxiliary|imperfective_aspect' },
	},
	{
		'name': 'Any \'be\' verb remaining before another verb becomes a generic auxiliary',
		'trigger': { 'category': 'Verb', 'stem': 'be' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': 'auxiliary' },
		'comment': 'the more precise function may be ambiguous e.g. "was cry-out"',
	},
	{
		'name': 'have before a Verb indicates flashback/perfect',
		'trigger': { 'stem': 'have' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'skip': 'vp_modifiers',
			},
		},
		'transform': { 'function': 'auxiliary|flashback' },
		'comment': 'don\'t check for the past participle form because of cases like "have cry-out"',
	},
	{
		'name': 'be before an auxiliary becomes an auxiliary',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': { 'tag': 'auxiliary', 'skip': 'vp_modifiers' },
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
		// TODO make this a case frame/sense selection rule
		'name': 'Select Adverbial senses of adpositions when first word of a subordinate clause',
		'trigger': { 'category': 'Adposition' },
		'context': {
			'precededby': { 'token': '[' },
		},
		'transform': { 'usage': 'C' },
		'comment': 'C means "Always in an Adverbial clause". eg by-A (Adverbial - C) vs by-B (Adjunct - A)',
	},
	{
		'name': 'tag head nouns',
		'trigger': { 'category': 'Noun' },
		'context': {
			'notprecededby': [{ 'category': 'Noun' }, { 'token': 'of', 'skip': 'np_modifiers' }],
			'notfollowedby': {
				'category': 'Noun',
				'skip': [
					{ 'tag': 'genitive_saxon|relative_clause' },	// can't use 'np_modifiers' since we don't skip the genitive_norman 'of'
					'determiners',
					'adjp_attributive',
				],
			},
		},
		'transform': { 'tag': 'head_np' },
	},
	{
		// TODO handle this in adjective case frame rules
		'name': 'tag predicate adjectives',
		'trigger': { 'category': 'Adjective' },
		'context': {
			'precededby': { 'category': 'Verb', 'skip': ['vp_modifiers', 'adjp_modifiers_predicative'] },
			'notfollowedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
		},
		'transform': { 'tag': 'predicate_adjective' },
	},
]

/** @type {BuiltInRule[]} */
const builtin_transform_rules = [
	{
		name: 'Set tag for relative clauses based on relativizer',
		comment: 'removes extra tags for words like "who" and "which". "that" also is not supposed to be used as a complementizer',
		rule: {
			trigger: create_token_filter({ 'tag': 'subordinate_clause' }),
			context: create_context_filter({
				'precededby': { 'category': 'Noun' },
				'subtokens': { 'tag': 'relativizer', 'skip': { 'token': '[' } },
			}),
			action: create_token_modify_action(token => {
				const relativizer = token.sub_tokens[1]
				token.tag = relativizer.token === 'that' ? 'relative_clause|relative_clause_that' : 'relative_clause'
				relativizer.tag = 'relativizer'
			}),
		},
	},
	{
		name: 'Set tag for "that" when not preceded by a Noun',
		comment: '"that" can only be a demonstrative in this case',
		rule: {
			trigger: create_token_filter({ 'tag': 'subordinate_clause' }),
			context: create_context_filter({
				'notprecededby': { 'category': 'Noun' },
				'subtokens': { 'token': 'that', 'skip': { 'token': '[' } },
			}),
			action: create_token_modify_action(token => {
				token.sub_tokens[1].tag = 'remote_demonstrative'
			}),
		},
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
	const context_transforms = create_token_transforms(rule_json['context_transform'])

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

export const TRANSFORM_RULES = builtin_transform_rules.map(({ rule }) => rule).concat(transform_rules_json.map(parse_transform_rule))
