import { apply_token_transforms, create_context_filter, create_token_filter, create_token_transform, create_token_transforms } from './rules_parser'

/**
 * These are words that may change their underlying data based on the context around them.
 * These can look at the lookup results of the surrounding tokens (ie syntactic category).
 */
const transform_rules_json = [
	// Verb infinitives and forms
	{
		'name': '"to" before a verb gets tagged as infinitive',
		'trigger': { 'token': 'to' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': { 'syntax': 'infinitive' } },
	},
	{
		'name': 'infinitive "to" as the first word of a subordinate should be tagged as "same subject"',
		'trigger': { 'tag': { 'syntax': 'infinitive' } },
		'context': {
			'precededby': { 'token': '[', 'skip': { 'category': 'Conjunction' } },
		},
		'transform': { 'function': { 'syntax': 'infinitive|infinitive_same_subject' } },
	},
	{
		'name': 'tag "in-order-to" and "by" as "same subject"',
		'trigger': { 'stem': 'in-order-to|by' },
		'context': {
			'precededby': { 'token': '[', 'skip': { 'category': 'Conjunction' } },
		},
		'transform': { 'tag': { 'syntax': 'infinitive_same_subject' } },
	},
	{
		'name': 'Mark a Verb with the present form as present',
		'trigger': { 'category': 'Verb', 'form': 'third singular present|present' },
		'context': {},
		'transform': { 'tag': { 'time': 'present' } },
	},
	{
		'name': 'Mark a Verb with the past form as past. And make it a function word',
		'trigger': { 'category': 'Verb', 'form': 'past' },
		'context': {},
		'transform': { 'tag': { 'time': 'past' } },
	},
	// Aspect Auxiliaries
	{
		'name': 'start or begin before a verb becomes a function word',
		'trigger': { 'stem': 'start|begin' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': { 'auxiliary': 'inceptive_aspect' } },
		'comment': 'support both "started eating" and "started to eat"',
	},
	{
		'name': 'stop before a verb becomes a function word',
		'trigger': { 'stem': 'stop' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': { 'auxiliary': 'cessative_aspect' } },
	},
	{
		'name': 'continue before a verb becomes a function word',
		'trigger': { 'stem': 'continue' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': { 'auxiliary': 'continuative_aspect' } },
		'comment': 'support both "continued eating" and "continued to eat"',
	},
	{
		'name': 'finish before a verb becomes a function word',
		'trigger': { 'stem': 'finish' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': { 'auxiliary': 'completive_aspect' } },
	},
	// Clause type setting
	{
		'name': 'Set tag for relative clauses and relativizers',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': {
			'precededby': {
				'category': 'Noun',
				'skip': [{ 'tag': { 'clause_type': 'relative_clause' } }, { 'token': ',' }],
			},
			'subtokens': {
				'tag': { 'syntax': 'relativizer' },
				'skip': [{ 'token': '[' }, { 'category': 'Conjunction' }],
			},
		},
		'transform': { 'tag': { 'clause_type': 'relative_clause' } },
		'subtoken_transform': { 'remove_tag': 'determiner' },
		'comment': 'removes extra tags for words like "who" and "which". clear the determiner tag but keep the syntax one. This also handles coordinate relative clauses.',
	},
	{
		'name': 'Set extra tag for relative clauses that use "that"',
		'trigger': { 'tag': { 'clause_type': 'relative_clause' } },
		'context': {
			'subtokens': {
				'token': 'that',
				'skip': [{ 'token': '[' }, { 'category': 'Conjunction' }],
			},
		},
		'transform': { 'tag': { 'clause_type': 'relative_clause|relative_clause_that' } },
		'comment': 'a later rule needs to know if the relativizer is "that". clear the determiner tag but keep the syntax one',
	},
	{
		'name': 'Set tag for "that" when not preceded by a Noun',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': {
			'notprecededby': { 'category': 'Noun' },
			'subtokens': {
				'token': 'that',
				'skip': [{ 'token': '[' }, { 'category': 'Conjunction' }],
			},
		},
		'subtoken_transform': { 'remove_tag': 'syntax' },
		'comment': '"that" should only be a demonstrative in this case. clear the syntax tag but keep the determiner one',
	},
	{
		'name': 'tag subordinate clauses starting with an adposition as adverbial',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': {
			'subtokens': {
				'category': 'Adposition',
				'skip': [{ 'token': '[' }, { 'category': 'Conjunction' }],
			},
		},
		'transform': { 'tag': { 'clause_type': 'adverbial_clause' } },
	},
	{
		'name': 'tag subordinate clauses along with \'it\' as agent clauses',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': { 'precededby': { 'tag': { 'syntax': 'agent_proposition_subject' }, 'skip': 'all' } },
		'transform': { 'tag': { 'clause_type': 'agent_clause' } },
		'comment': 'Ruth 2:22 It is good that you continue working...',
	},
	{
		'name': 'tag subordinate clauses that directly precede the verb as agent clauses',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': { 'followedby': { 'category': 'Verb' } },
		'transform': { 'tag': { 'clause_type': 'agent_clause' } },
		'comment': 'It is true that John read that book',
	},
	{
		'name': "tag 'that' relative clauses that occur with 'it' as agent clauses",
		'trigger': { 'tag': { 'clause_type': 'relative_clause_that' } },
		'context': {
			'precededby': { 'tag': { 'syntax': 'agent_proposition_subject' }, 'skip': ['np', 'vp'] },
		},
		'transform': { 'tag': { 'clause_type': 'agent_clause' } },
		'comment': 'It please Mary [that John read this book]. - this was originally tagged as a relative clause but the \'it\' takes priority',
	},
	{
		'name': "tag subordinate clauses starting with the infinitive 'to' as 'same_participant'",
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': { 
			'subtokens': { 'token': 'to', 'tag': { 'syntax': 'infinitive_same_subject' }, 'skip': 'all' },
		},
		'transform': { 'tag': { 'clause_type': 'patient_clause_same_participant' } },
		'comment': 'eg John wanted [to sing]',
	},
	{
		'name': "tag subordinate clauses starting with a participle Verb as 'same_participant'",
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': {
			'subtokens': {
				'category': 'Verb',
				'form': 'stem|participle',
				'skip': [{ 'token': '[' }, { 'category': 'Conjunction' }],
			},
		},
		'transform': { 'tag': { 'clause_type': 'patient_clause_same_participant' } },
		'comment': 'eg John likes [singing]',
	},
	{
		'name': 'tag subordinate clauses where the verb is a participle for see/hear',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'context': {
			'precededby': { 'category': 'Verb', 'stem': 'see|hear', 'skip': 'all' },
			'subtokens': {
				'category': 'Verb',
				'form': 'stem|participle',
				'skip': 'all',
			},
		},
		'transform': { 'tag': { 'clause_type': 'patient_clause_simultaneous|patient_clause_different_participant' } },
		'comment': 'eg. "John saw [Mary walking]." This rule should apply before setting "be" as an auxilliary, but after setting the aspect verbs as auxilliaries',
	},
	{
		'name': 'any remaining subordinate_clause is a \'different_participant\' patient clause by default',
		'trigger': { 'tag': { 'clause_type': 'subordinate_clause' } },
		'transform': { 'tag': { 'clause_type': 'patient_clause_different_participant' } },
	},
	{
		'name': 'tag all clause arguments with role: "none"',
		'trigger': { 'tag': { 'clause_type': 'patient_clause_different_participant|patient_clause_same_participant|patient_clause_quote_begin|agent_clause' } },
		'transform': { 'tag': { 'role': 'none' } },
		'comment': 'Setting up for the case frame rules',
	},
	{
		'name': 'tag \'that\' at the beginning of a main clause as remove_demonstrative when followed by a noun',
		'trigger': { 'token': 'That|that' },
		'context': {
			'notprecededby': { 'token': '[', 'skip': { 'category': 'Conjunction' } },
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
		},
		'transform': { 'remove_tag': 'syntax' },
		'comment': 'this clears the relativizer tag but keeps the determiner tag',
	},
	// General function words
	{
		'name': '"no" before a noun becomes negative_noun_polarity',
		'trigger': { 'token': 'no' },
		'context': { 'followedby': { 'category': 'Noun', 'skip': { 'category': 'Adjective' } } },
		'transform': { 'function': { 'determiner': 'negative_noun_polarity' } },
	},
	{
		'name': '"most" before adjective or adverb becomes a function word',
		'trigger': { 'stem': 'most' },
		'context': {
			'followedby': { 'category': 'Adjective|Adverb' },
		},
		'transform': { 'function': { 'degree': 'superlative' } },
	},
	{
		'name': '"more" before adjective of adverb and "than" becomes a function word',
		'trigger': { 'stem': 'more' },
		'context': {
			'followedby': [{ 'category': 'Adjective|Adverb' }, { 'tag': { 'pre_np_adposition': 'comparative_than' } }],
		},
		'transform': { 'function': { 'degree': 'comparative' } },
		'comment': "eg 'more content than X', etc ",
	},
	{
		'name': '"as" in "as Adj/Adv as..." becomes a function word',
		'trigger': { 'stem': 'as' },
		'context': {
			'followedby': [{ 'category': 'Adjective|Adverb' }, { 'stem': 'as' }],
		},
		'transform': { 'function': { 'degree': 'equality' } },
		'context_transform': [{ }, { 'function': { 'pre_np_adposition': 'comparative_as' } }],
		'comment': "eg 'as valuable as X', etc ",
	},
	{
		'name': '\'who\'/\'what\' gets tagged with interrogative_which when in a question',
		'trigger': { 'token': 'Who|who|What|what' },
		'context': {
			'followedby': { 'token': '?', 'skip': 'all' },
		},
		'transform': { 'tag': { 'determiner': 'interrogative' }, 'remove_tag': 'syntax' },
		'comment': '"who/what" becomes "which person-A/thing-A" respectively when in a question. So tag it, but do not make it a function word',
	},
	// Noun-Noun relationships
	{
		'name': '\'named\' before a name and after a Verb becomes a function word',
		'trigger': { 'token': 'named' },
		'context': {
			'precededby': { 'category': 'Verb', 'skip': 'all' },
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
		},
		'transform': { 'function': { 'relation': 'name', 'pre_np_adposition': 'relation' } },
	},
	{
		'name': '\'named\' before a name and before a Verb becomes a function word',
		'trigger': { 'token': 'named' },
		'context': {
			'followedby': [
				{ 'category': 'Noun', 'skip': 'np_modifiers' },
				{ 'category': 'Verb', 'skip': 'all' },
			],
		},
		'transform': { 'function': { 'relation': 'name', 'pre_np_adposition': 'relation' } },
	},
	{
		'name': '\'of\' after group/crowd becomes a function word',
		'trigger': { 'token': 'of' },
		'context': { 'precededby': { 'stem': 'group|crowd' } },
		'transform': { 'function': { 'relation': 'group' }, 'remove_tag': 'pre_np_adposition' },
	},
	{
		'name': 'certain Noun-Noun combinations are "made_of"',
		'trigger': { 'category': 'Noun', 'stem': 'bamboo|bronze|gold|iron|leather|marble|metal|plastic|silver|wood' },
		'context': { 'followedby': { 'category': 'Noun' } },
		'transform': { 'tag': { 'relation': 'made_of' } },
		'comment': 'eg. a gold statue; a bamboo chair. The Nouns are always right next to each other',
	},
	{
		'name': 'certain Noun-Noun combinations are "title"',
		'trigger': { 'category': 'Noun' },
		'context': {
			'precededby': { 'category': 'Noun', 'stem': 'king|queen|Christ|Caesar|Lord' },
			'notprecededby': { 'tag': 'relation' },
		},
		'context_transform': { 'tag': { 'relation': 'title' } },
		'comment': "eg. King Herod, Lord Jesus, but NOT 'the king's army'",
	},
	// Senses of 'be'
	{
		'name': 'Tag \'there\' before \'be\' as existential',
		'trigger': { 'token': 'There|there' },
		'context': {
			'followedby': { 'stem': 'be', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': { 'syntax': 'existential' } },
		'comment': 'We have to keep this as a transform rule so we can handle the "there" properly.',
	},
	{
		'name': "'part' and 'like' after 'be' become function words",
		'trigger': { 'token': 'part|like' },
		'context': {
			'precededby': { 'stem': 'be', 'skip': 'vp_modifiers' },
		},
		'transform': { 'function': {} },
		'comment': "Since 'part' and 'like' are also words in the Ontology, this ensures the clause is interpreted correctly",
	},
	{
		'name': '\'made of\' after \'be\' becomes a function word',
		'trigger': { 'token': 'made' },
		'context': {
			'precededby': { 'stem': 'be', 'skip': 'vp_modifiers' },
			'followedby': { 'token': 'of' },
		},
		'transform': { 'function': {} },
		'comment': 'The Analyzer always fully deletes the phrase "made of", but we can be more specific',
	},
	// Other Verb auxiliaries
	{
		'name': 'do with not becomes an auxiliary',
		'trigger': { 'stem': 'do' },
		'context': {
			'followedby': { 'token': 'not' },
		},
		'transform': { 'function': { 'auxiliary': 'negation' } },
	},
	{
		'name': 'do in a question becomes an auxiliary',
		'trigger': { 'stem': 'do' },
		'context': {
			'followedby': [{ 'category': 'Verb', 'skip': 'all' }, { 'token': '?', 'skip': 'all' }],
		},
		'transform': { 'function': { 'auxiliary': 'yes_no_interrogative' } },
	},
	{
		'name': 'have before a Verb indicates flashback/perfect',
		'trigger': { 'stem': 'have' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'all' },
			'notfollowedby': { 'tag': { 'syntax': 'infinitive' }, 'skip': 'all' },
		},
		'transform': { 'function': { 'auxiliary': 'flashback', 'time': 'past' } },
		'comment': 'don\'t check for the perfect form because of cases like "have cry-out". But ignore "have to cry-out" which is incorrect. The perfect is always indicative of the past in TBTA',
	},
	{
		'name': 'be before a participle Verb indicates imperfective',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'participle',
				'skip': 'all',
			},
		},
		'transform': { 'function': { 'auxiliary': 'imperfective_aspect' } },
		'comment': 'skip all because it may be a question (eg. "Are those people going?"). We\'ll have to assume it\'s not an error.',
	},
	{
		'name': 'be before a perfect Verb indicates passive',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': {
				'category': 'Verb',
				'form': 'perfect',
				'skip': 'all',
			},
		},
		'transform': { 'function': { 'auxiliary': 'passive' } },
		'comment': 'skip all because it may be a question (eg. "Are those words written in the book?"). We\'ll have to assume it\'s not an error.',
	},
	{
		'name': 'Any \'be\' verb remaining before another verb becomes a generic auxiliary',
		'trigger': { 'category': 'Verb', 'stem': 'be' },
		'context': {
			'followedby': { 'category': 'Verb', 'skip': 'all' },
			'notfollowedby': { 'tag': { 'syntax': 'infinitive' }, 'skip': 'all' },
		},
		'transform': { 'function': { 'auxiliary': 'generic' } },
		'comment': 'the more precise function may be ambiguous e.g. "was cry-out". But ignore "be to cry-out" which is incorrect',
	},
	{
		'name': 'by preceded by a passive be indicates the agent',
		'trigger': { 'stem': 'by' },
		'context': {
			'precededby': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
		},
		'transform': { 'function': { 'pre_np_adposition': 'agent_of_passive' } },
	},
	// Adpositions
	{
		'name': '\'that\' followed by the Adposition \'so\' does not have any function',
		'trigger': { 'token': 'that' },
		'context': {
			'precededby': { 'stem': 'so', 'category': 'Adposition' },
		},
		'transform': { 'remove_tag': ['syntax', 'determiner'] },
		'comment': 'both "so that" and "so-that" are supported and map to the Adposition "so"',
	},
	// Noun Phrase handling
	{
		'name': 'tag head nouns',
		'trigger': { 'category': 'Noun' },
		'context': {
			'notprecededby': [{ 'category': 'Noun' }, { 'token': 'of', 'skip': 'np_modifiers' }],
		},
		'transform': { 'tag': { 'syntax': 'head_np', 'role': 'none' } },
		'comment': "can't use 'np_modifiers' in the 'notfollowedby' skip since we don't want to skip the genitive_norman 'of'",
	},
	{
		'name': 'remove head_np tag from saxon genitives, made_of, and title relations',
		'trigger': { 'tag': { 'relation': 'genitive_saxon|made_of|title' } },
		'context': { },
		'transform': { 'remove_tag': ['syntax', 'role'] },
	},
	{
		'name': 'handle noun argument for relationship with X',
		'trigger': { 'stem': 'relationship' },
		'context': {
			'followedby': [
				{ 'token': 'with' },
				{ 'category': 'Noun', 'skip': 'np_modifiers' },
			],
		},
		'context_transform': [
			{ 'function': { 'pre_np_adposition': 'noun_argument' } },
			{ 'tag': { 'syntax': 'nested_np', 'role': 'noun_argument_np' } },
		],
		'comment': "eg 'relationship with X'. X should not be interpreted as an argument of a Verb",
	},
	{
		'name': 'handle noun argument for faith in X',
		'trigger': { 'stem': 'faith' },
		'context': {
			'followedby': [
				{ 'token': 'in' },
				{ 'category': 'Noun', 'skip': 'np_modifiers' },
			],
		},
		'context_transform': [
			{ 'function': { 'pre_np_adposition': 'noun_argument' } },
			{ 'tag': { 'syntax': 'nested_np', 'role': 'noun_argument_np' } },
		],
		'comment': "eg 'faith in X'. X should not be interpreted as an argument of a Verb",
	},
	{
		'name': 'handle comparative noun arguments',
		'trigger': { 'tag': { 'pre_np_adposition': 'comparative_than|comparative_as' } },
		'context': {
			'followedby': { 'category': 'Noun', 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
		},
		'context_transform': { 'tag': { 'syntax': 'nested_np|comparative_np' } },
		'comment': "eg 'bigger than X', 'more content than X', 'more food than X', etc ",
	},
	// Commas and Coordination
	{
		'name': 'tag all commas',
		'trigger': { 'token': ',' },
		'transform': { 'tag': { 'syntax': 'comma' } },
	},
	{
		'name': 'tag addressee nouns and commas',
		'trigger': { 'tag': { 'syntax': 'head_np' } },
		'context': {
			'followedby': [
				{ 'token': ',', 'skip': [{ 'category': 'Conjunction' }, 'np'] },
				{ 'tag': { 'syntax': 'head_np' }, 'skip': 'all' },	// the agent
				{ 'category': 'Verb', 'skip': 'all' },
			],
		},
		'transform': { 'tag': { 'role': 'addressee' } },
		'context_transform': [{ 'tag': { 'syntax': 'comma_addressee' } }],
	},
	{
		'name': 'by default, tag all "and/or" as "noun" coordination',
		'trigger': { 'stem': 'and|or' },
		'transform': { 'tag': { 'syntax': 'coord_noun' } },
	},
	{
		'name': 'tag "and/or" with adjectives',
		'trigger': { 'stem': 'and|or' },
		'context': { 'precededby': { 'category': 'Adjective', 'skip': { 'token': ',' } } },
		'transform': { 'tag': { 'syntax': 'coord_adj' } },
	},
	{
		'name': 'tag "and" with adverbs',
		'trigger': { 'stem': 'and' },
		'context': { 'precededby': { 'category': 'Adverb', 'skip': { 'token': ',' } } },
		'transform': { 'tag': { 'syntax': 'coord_adv' } },
	},
	{
		'name': 'tag "and/or" at start of subordinate clauses',
		'trigger': { 'stem': 'and|or' },
		'context': { 'precededby': { 'token': '[' } },
		'transform': { 'tag': { 'syntax': 'coord_clause' } },
	},
	{
		'name': 'tag "and/or" at start of sentences',
		'trigger': { 'stem': 'and|or', 'tag': { 'position': 'first_word' } },
		'transform': { 'tag': { 'syntax': 'coord_clause' } },
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
	const subtoken_transforms = create_token_transforms(rule_json['subtoken_transform'])

	return {
		trigger,
		context,
		action: transform_rule_action,
	}

	/**
	 * 
	 * @param {RuleTriggerContext} trigger_context 
	 * @returns {number}
	 */
	function transform_rule_action({ tokens, trigger_index, context_indexes, subtoken_indexes }) {
		const transforms = [transform, ...context_transforms]
		const indexes = [trigger_index, ...context_indexes]

		apply_token_transforms(tokens, indexes, transforms)
		apply_token_transforms(tokens[trigger_index].sub_tokens, subtoken_indexes, subtoken_transforms)

		return trigger_index + 1
	}
}

export const TRANSFORM_RULES = transform_rules_json.map(parse_transform_rule)
