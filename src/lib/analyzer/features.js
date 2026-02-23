import { create_context_filter, create_token_filter } from '$lib/rules/rules_parser'

/**
 * @typedef {TokenRuleJsonBase | TokenRuleJsonBase[]} FeatureRuleJson
 * @typedef {[FeatureValue, TokenRule[]]} FeatureValueRules
 * @typedef {[FeatureName, FeatureValueRules[]]} FeatureRules
 * @typedef {Record<CategoryName, FeatureRules[]>} FeatureRulesByCategory
 */

/** @type {Record<CategoryName, [FeatureName, [FeatureValue, FeatureRuleJson][]][]>} */
const feature_rules_json = {
	'Noun': [
		['Number', [
			['Singular', { }],
			['Plural', {
				'trigger': { 'form': 'plural' },
			}],
			['Singular', {
				'trigger': { 'form': 'stem' },
			}],
			['Plural', {
				'context': { 'followedby': { 'token': '_plural' } },
			}],
			['Dual', {
				'context': { 'followedby': { 'token': '_dual' } },
			}],
		]],
		['Participant Tracking', [
			['Routine', { }],
			['First Mention', {
				'context': { 'precededby': { 'tag': { 'determiner': 'indefinite_article' }, 'skip': 'np_modifiers' } },
			}],
			['Generic', {
				'context': { 'followedby': { 'token': '_generic' } },
			}],
			['Frame Inferable', {
				'context': { 'followedby': { 'token': '_frameInferable' } },
			}],
			['Interrogative', {
				'trigger': { 'tag': { 'noun_tracking': 'interrogative' } },
			}],
		]],
		['Polarity', [
			['Affirmative', { }],
			['Negative', {
				'context': { 'precededby': { 'tag': { 'determiner': 'negative_noun_polarity' }, 'skip': 'np_modifiers' } },
			}],
		]],
		['Proximity', [
			['Not Applicable', { }],
			['Contextually Near with Focus', {
				'context': { 'precededby': { 'tag': { 'determiner': 'near_demonstrative' }, 'skip': 'np_modifiers' } },
			}],
			['Contextually Near', {
				'context': { 'precededby': { 'tag': { 'determiner': 'remote_demonstrative' }, 'skip': 'np_modifiers' } },
			}],
		]],
		['Person', [
			['Third', { }],
			['First', {
				'trigger': { 'tag': { 'pronoun': 'first_person' } },
			}],
			['Second', {
				'trigger': { 'tag': { 'pronoun': 'second_person' } },
			}],
			['First Inclusive', {
				'trigger': { 'tag': { 'pronoun': 'first_person&plural' } },
			}],
			['First Exclusive', {
				'trigger': { 'tag': { 'pronoun': 'first_person&plural' } },
				'context': { 'followedby': { 'token': '_excl|_exclusive' } },
			}],
		]],
		['Participant Status', [
			['Not Applicable', { }],
			['Emphasized', {
				'context': { 'followedby': { 'token': '_emphasized' } },
			}],
		]],
	],
	'Verb': [
		['Time', [
			['Present', { }],
			['Present', [
				{ 'trigger': { 'tag': { 'time': 'present' } } },
				{ 'context': { 'precededby': { 'tag': { 'time': 'present' }, 'skip': 'all' } } },
			]],
			['Discourse', [
				{ 'trigger': { 'tag': { 'time': 'past' } } },
				{ 'context': { 'precededby': { 'tag': { 'time': 'past' }, 'skip': 'all' } } },
			]],
			['Immediate Future', [
				{ 'context': { 'precededby': { 'tag': { 'time': 'future' }, 'skip': 'all' } } },
				{ 'context': { 'precededby': { 'token': '(imp)|_jussive|(jussive)|_suggestiveLets|(suggestivelets)', 'skip': 'all' } } },
				{ 'context': { 'followedby': { 'token': '(imp)|_jussive|(jussive)|_suggestiveLets|(suggestivelets)', 'skip': 'all' } } },
			]],
		]],
		['Aspect', [
			['Unmarked', { }],
			['Inceptive', {
				'context': { 'precededby': { 'tag': { 'auxiliary': 'inceptive_aspect' }, 'skip': 'all' } },
			}],
			['Completive', {
				'context': { 'precededby': { 'tag': { 'auxiliary': 'completive_aspect' }, 'skip': 'all' } },
			}],
			['Cessative', {
				'context': { 'precededby': { 'tag': { 'auxiliary': 'cessative_aspect' }, 'skip': 'all' } },
			}],
			['Continuative', {
				'context': { 'precededby': { 'tag': { 'auxiliary': 'continuative_aspect' }, 'skip': 'all' } },
			}],
			['Imperfective', {
				'trigger': { 'tag': { 'auxiliary': 'imperfective_aspect' } },
				'context': { 'precededby': { 'tag': { 'time': 'present' }, 'skip': 'all' } },
			}],
			['Routine', {
				'context': { 'followedby': { 'token': '_routine' } },
			}],
		]],
		['Mood', [
			['Indicative', { }],
			['Definite Potential', {
				'context': { 'precededby': { 'tag': { 'modal': 'definite_mood' }, 'skip': 'all' } },
			}],
			['Probable Potential', {
				'context': { 'precededby': { 'tag': { 'modal': 'probable_mood' }, 'skip': 'all' } },
			}],
			["'might' Potential", {
				'context': { 'precededby': { 'tag': { 'modal': 'might_mood' }, 'skip': 'all' } },
			}],
			["'must' Obligation", {
				'context': { 'precededby': { 'tag': { 'modal': 'must_mood' }, 'skip': 'all' } },
			}],
			["'should' Obligation", {
				'context': { 'precededby': { 'tag': { 'modal': 'should_mood' }, 'skip': 'all' } },
			}],
			["'may' (permissive)", {
				'context': { 'precededby': { 'tag': { 'modal': 'may_permissive_mood' }, 'skip': 'all' } },
			}],
		]],
		['Reflexivity', [
			['Not Applicable', { }],
			['Reciprocal', {
				'context': { 'followedby': { 'tag': { 'pronoun': 'reciprocal' }, 'skip': 'all' } },
			}],
			['Reflexivity', [
				{ 'context': { 'followedby': { 'tag': { 'pronoun': 'reflexive' }, 'skip': 'all' } } },
				{ 'context': { 'followedby': { 'token': '_reflexive', 'skip': 'all' } } },
			]],
		]],
		['Polarity', [
			['Affirmative', { }],
			['Negative', [
				{ 'context': { 'precededby': { 'tag': { 'verb_polarity': 'negative' }, 'skip': 'all' } } },
				{ 'context': { 'followedby': { 'tag': { 'verb_polarity': 'negative' }, 'skip': 'all' } } },
			]],
		]],
	],
	'Adjective': [
		['Degree', [
			['No Degree', { }],
			['Comparative', [
				{ 'context': { 'precededby': { 'tag': { 'degree': 'comparative' }, 'skip': 'adjp_modifiers_predicative' } } },
				{ 'trigger': { 'form': 'comparative' } },
			]],
			['Superlative', [
				{ 'context': { 'precededby': { 'tag': { 'degree': 'superlative' }, 'skip': 'adjp_modifiers_predicative' } } },
				{ 'trigger': { 'form': 'superlative' } },
			]],
			['Intensified', {
				'context': { 'precededby': { 'tag': { 'degree': 'intensified' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			['Extremely Intensified', {
				'context': { 'precededby': { 'tag': { 'degree': 'extremely_intensified' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			["'too'", {
				'context': { 'precededby': { 'tag': { 'degree': 'too' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			["'less'", {
				'context': { 'precededby': { 'tag': { 'degree': 'less' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			["'least'", {
				'context': { 'precededby': { 'tag': { 'degree': 'least' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			['Equality', {
				'context': { 'precededby': { 'tag': { 'degree': 'equality' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
		]],
	],
	'Adverb': [
		['Degree', [
			['No Degree', { }],
			['Comparative', [
				{ 'context': { 'precededby': { 'tag': { 'degree': 'comparative' } } } },
				{ 'trigger': { 'form': 'comparative' } },
			]],
			['Superlative', [
				{ 'context': { 'precededby': { 'tag': { 'degree': 'superlative' } } } },
				{ 'trigger': { 'form': 'superlative' } },
			]],
			['Intensified', {
				'context': { 'precededby': { 'tag': { 'degree': 'intensified' } } },
			}],
			['Extremely Intensified', {
				'context': { 'precededby': { 'tag': { 'degree': 'extremely_intensified' } } },
			}],
			["'too'", {
				'context': { 'precededby': { 'tag': { 'degree': 'too' } } },
			}],
			["'less'", {
				'context': { 'precededby': { 'tag': { 'degree': 'less' } } },
			}],
			["'least'", {
				'context': { 'precededby': { 'tag': { 'degree': 'least' } } },
			}],
		]],
	],
	'Adposition': [],
	'Conjunction': [
		['Implicit', [
			['No', { }],
			['Yes', {
				'context': { 'followedby': { 'token': '_implicit' } },
			}],
		]],
	],
	'Noun Phrase': [
		['Semantic Role', [
			['Not Applicable', { }],
			['Most Agent-like', {
				'trigger': { 'tag': { 'role': 'agent' } },
			}],
			['Most Patient-like', {
				'trigger': { 'tag': { 'role': 'patient' } },
			}],
			['State', {
				'trigger': { 'tag': { 'role': 'state' } },
			}],
			['Source', {
				'trigger': { 'tag': { 'role': 'source' } },
			}],
			['Destination', {
				'trigger': { 'tag': { 'role': 'destination' } },
			}],
			['Instrument', {
				'trigger': { 'tag': { 'role': 'instrument' } },
			}],
			['Beneficiary', {
				'trigger': { 'tag': { 'role': 'beneficiary' } },
			}],
			['Addressee', {
				'trigger': { 'tag': { 'role': 'addressee' } },
			}],
		]],
		['Implicit', [
			// TODO this needs to be handled differently, since we need to know which Noun is the head of this NP
		]],
	],
	'Verb Phrase': [
		['Implicit', [
			['No', { }],
			['Yes', {
				'context': {
					'followedby': [
						{ 'category': 'Verb', 'skip': 'vp_modifiers' },
						{ 'token': '_implicit' },
					],
				},
			}],
		]],
	],
	'Adjective Phrase': [
		['Usage', [
			['Predicative', { }],
			['Attributive', {
				'trigger': { 'tag': { 'adj_usage': 'attributive' } },
			}],
		]],
		['Implicit', [
			// TODO this needs to be handled differently, since we need to know which Adjective is the head of this AdjP
		]],
	],
	'Adverb Phrase': [
		['Implicit', [
			['No', { }],
			['Yes', {
				'context': {
					'followedby': [
						{ 'category': 'Adverb', 'skip': 'advp_modifiers' },
						{ 'token': '_implicit' },
					],
				},
			}],
		]],
	],
	'Clause': [
		['Type', [
			['Independent', {
				'trigger': { 'tag': { 'clause_type': 'main_clause' } },
			}],
			['Restrictive Thing Modifier (Relative Clause)', {
				'trigger': { 'tag': { 'relative_clause': 'restrictive' } },
			}],
			['Descriptive Thing Modifier (Relative Clause)', {
				'trigger': { 'tag': { 'relative_clause': 'descriptive' } },
			}],
			['Event Modifier (Adverbial Clause)', {
				'trigger': { 'tag': { 'clause_type': 'adverbial_clause' } },
			}],
			['Agent (Subject Complement)', {
				'trigger': { 'tag': { 'clause_type': 'agent_clause' } },
			}],
			['Patient (Object Complement)', {
				'trigger': { 'tag': { 'clause_type': 'patient_clause_same_participant|patient_clause_different_participant|patient_clause_quote_begin' } },
			}],
			['Attributive Patient (Adjectival Object Complement)', {
				'trigger': { 'tag': { 'role': 'adjective_clausal_argument' } },
			}],
		]],
		['Illocutionary Force', [
			['Declarative', { }],
			['Imperative', {
				'context': {
					'subtokens': { 'token': '(imp)', 'skip': 'all' },
				},
			}],
			['Content Interrogative', {
				'trigger': { 'tag': { 'interrogative': 'content' } },
			}],
			['Yes-No Interrogative', {
				'trigger': { 'tag': { 'interrogative': 'yes-no' } },
			}],
			["Suggestive 'let's'", {
				'context': {
					'subtokens': { 'token': '_suggestiveLets|(suggestivelets)', 'skip': 'all' },
				},
			}],
			['Jussive', {
				'context': {
					'subtokens': { 'token': '_jussive|(jussive)', 'skip': 'all' },
				},
			}],
		]],
		['Topic NP', [
			['Most Agent-like', { }],
			['Most Patient-like', {
				'context': {
					'subtokens': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
				},
			}],
		]],
		['Salience Band', [
			['Primary Storyline', { }],
			['Backgrounded Actions', {
				'context': {
					'subtokens': [
						{ 'tag': { 'time': 'past' }, 'skip': 'all' },
						{ 'tag': { 'auxiliary': 'imperfective_aspect' }, 'skip': 'all' },
					],
				},
			}],
			['Flashback', {
				'context': {
					'subtokens': { 'tag': { 'auxiliary': 'flashback' }, 'skip': 'all' },
				},
			}],
		]],
		['Implicit Information', [
			['Not Applicable', { }],
			['Implicit Cultural Information', {
				'context': {
					'subtokens': { 'token': '(implicit-cultural)', 'skip': 'all' },
				},
			}],
			['Implicit Situational Information', {
				'context': {
					'subtokens': { 'token': '(implicit-situational)', 'skip': 'all' },
				},
			}],
			['Implicit Historical Information', {
				'context': {
					'subtokens': { 'token': '(implicit-historical)', 'skip': 'all' },
				},
			}],
			['Implicit Background Information', {
				'context': {
					'subtokens': { 'token': '(implicit-background)', 'skip': 'all' },
				},
			}],
			['Implicit Subactions', {
				'context': {
					'subtokens': { 'token': '(implicit-subaction)', 'skip': 'all' },
				},
			}],
			['Implicit Argument', {
				'context': {
					'subtokens': { 'token': '(implicit-argument)', 'skip': 'all' },
				},
			}],
		]],
		['Location', [
			// TODO
			['Not Applicable', { }],
		]],
		['Alternative Analysis', [
			// TODO
			['Not Applicable', { }],
		]],
		['Vocabulary Alternate', [
			// TODO
			['Not Applicable', { }],
		]],
		['Rhetorical Question', [
			// TODO
			['Not Applicable', { }],
		]],
	],
}

/** @type {FeatureRulesByCategory} */
const FEATURE_RULES_BY_CATEGORY = parse_all_feature_rules()

/**
 * @returns {FeatureRulesByCategory}
 */
function parse_all_feature_rules() {
	return Object.fromEntries(Object.entries(feature_rules_json).map(([pos, pos_feature_rules_json]) => {
		return [
			pos,
			pos_feature_rules_json.map(([feature_name, feature_values_json]) => {
				return [
					feature_name,
					feature_values_json.map(([feature_value, rule_json]) => {
						return [feature_value, parse_feature_rule_json(pos, feature_name, feature_value, rule_json)]
					}),
				]
			}),
		]
	}))

	/**
	 * @param {string} part_of_speech 
	 * @param {FeatureName} feature_name 
	 * @param {FeatureValue} feature_value 
	 * @param {FeatureRuleJson} rule_json 
	 * @returns {TokenRule[]}
	 */
	function parse_feature_rule_json(part_of_speech, feature_name, feature_value, rule_json) {
		if (Array.isArray(rule_json)) {
			return rule_json.flatMap(json => parse_feature_rule_json(part_of_speech, feature_name, feature_value, json))
		}

		const trigger = create_token_filter(rule_json['trigger'] || 'all')
		const context = create_context_filter(rule_json['context'])
	
		return [{
			id: `feature:${part_of_speech}:${feature_name}:${feature_value}`,
			name: '',
			trigger,
			context,
			action: ({ trigger_index }) => trigger_index + 1,	// No actual action is performed at this level
		}]
	}
}

/**
 * 
 * @param {Token[]} tokens
 * @param {number} token_index
 * @param {CategoryName} category
 * @return {EntityFeature[]}
 */
export function get_features_for_token(tokens, token_index, category) {
	const category_feature_rules = FEATURE_RULES_BY_CATEGORY[category] || []
	return category_feature_rules.map(([feature_name, feature_rules]) => {
		const selected_value_rules = feature_rules.findLast(([, rules]) => rules.some(rule => test_feature_rule(tokens, token_index, rule)))
		return {
			name: feature_name,
			value: selected_value_rules?.[0] || '',
		}
	})
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} token_index 
 * @param {TokenRule} rule 
 */
function test_feature_rule(tokens, token_index, rule) {
	return rule.trigger(tokens[token_index]) && rule.context(tokens, token_index).success
}