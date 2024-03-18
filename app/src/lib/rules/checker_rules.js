import { ERRORS } from '$lib/parser/error_messages'
import { TOKEN_TYPE, convert_to_error_token, create_added_token } from '$lib/parser/token'
import { create_context_filter, create_token_filter, create_token_modify_action } from './rules_parser'

const checker_rules_json = [
	{
		'name': 'Speak does not use quotes',
		'trigger': { 'stem': 'speak' },
		'context': {
			'followedby': { 'tag': 'quote_begin', 'skip': 'all' },
		},
		'require': {
			'message': '\'Speak\' cannot be used with a direct quote. Consider using \'say\' instead.',
		},
	},
	{
		'name': 'Expect an agent of a passive',
		'trigger': { 'category': 'Verb' },
		'context': {
			'precededby': { 'tag': 'passive', 'skip': 'all' },
			'notfollowedby': { 'tag': 'agent_of_passive', 'skip': 'all' },
		},
		'require': {
			'followedby': 'by X',
			'message': 'Missing agent of passive verb. Use _implicitActiveAgent if necessary.',
		},
	},
	{
		'name': 'Suggest avoiding the Perfect aspect',
		'trigger': { 'tag': 'flashback' },
		'suggest': {
			'message': 'The perfect is only allowed if it would have the right meaning if changed to the simple past tense with "recently" or "previously".',
		},
	},
	{
		'name': 'each other must be hyphenated',
		'trigger': { 'stem': 'each' },
		'context': {
			'followedby': { 'stem': 'other' },
			'notfollowedby': { 'category': 'Noun', 'skip': { 'category': 'Adjective' } },
		},
		'require': {
			'message': 'Reciprocal each-other must be hyphenated.',
		},
	},
	{
		'name': 'Suggest expanding \'there\' to \'at that place\' for clarity',
		'trigger': { 'token': 'There|there' },
		'context': { 'notfollowedby': { 'stem': 'be' } },	// TODO trigger on 'not tag existential' instead
		'suggest': {
			'message': 'Consider using \'at that place\' instead of \'there\', especially if a preposition other than \'at\' is wanted.',
		},
	},
	{
		'name': 'Suggest expanding \'here\' to \'at this place\' for clarity',
		'trigger': { 'token': 'Here|here' },
		'suggest': {
			'message': 'Consider using \'at this place\' instead of \'here\', especially if a preposition other than \'at\' is wanted.',
		},
	},
	{
		'name': 'Flag two verbs within the same sentence',
		'trigger': { 'category': 'Verb' },
		'context': {
			'precededby': { 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot have multiple verbs in the same clause. Check for an unbracketed subordinate clause or consider splitting the sentence.',
		},
		'comment': 'See section 0.3 of the Phase 1 checklist',
	},
	{
		'name': 'Check for an Imperative Verb with no subject at the beginning of a sentence',
		'trigger': { 'category': 'Verb', 'form': 'stem', 'tag': 'first_word' },
		'require': {
			'precededby': 'You(X) (imp)',
			'message': 'An imperative clause must have an explicit subject.',
		},
	},
	{
		'name': 'Check for an Imperative Verb with no subject after a conjunction at the beginning of a sentence',
		'trigger': { 'category': 'Verb', 'form': 'stem' },
		'context': {
			'precededby': { 'category': 'Conjunction', 'tag': 'first_word' },
		},
		'require': {
			'precededby': 'you(X) (imp)',
			'message': 'An imperative clause must have an explicit subject.',
		},
	},
	{
		'name': 'Check for an imperative note that does not follow the \'you\'',
		'trigger': { 'token': '(imp)' },
		'context': {
			'notprecededby': { 'tag': 'second_person' },
		},
		'suggest': {
			'message': 'Consider putting the imperative (imp) notation after the \'you\' subject of the clause.',
		},
	},
	{
		'name': 'Check for an imperative note in a complement clause',
		'trigger': { 'token': '(imp)' },
		'context': {
			'precededby': { 'tag': 'complementizer', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot mark complement clauses as imperative.',
		},
	},
	{
		'name': 'Check for "Let\'s"',
		'trigger': { 'token': 'Let\'s|let\'s' },
		'require': {
			'message': 'Write \'We(X) go _suggestiveLets\' instead. See P1 Checklist section 15.',
		},
	},
	{
		'name': 'Check for \'Let X...\'',
		'trigger': { 'token': 'Let' },
		'context': {
			'followedby': { 'category': 'Noun' },
		},
		'require': {
			'message': 'For the jussive write \'X (jussive) ...\' instead of \'Let X...\'. Or use \'(imp)\' for expressing permission. See P1 Checklist section 15.',
		},
	},
	{
		'name': 'Check for \'May X...\'',
		'trigger': { 'token': 'May' },
		'context': {
			'followedby': { 'category': 'Noun' },
		},
		'require': {
			'message': 'Write \'I(X) pray-hope [Y...]\' instead. See P1 Checklist section 15.',
		},
	},
	{
		'name': 'Avoid using \'way\'',
		'trigger': { 'stem': 'way' },
		'suggest': {
			'message': 'Consider rewording to avoid the use of \'way\'. If that is impossible, you can still use it in the sense of means or method.',
		},
		'comment': 'See section X of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use \'even\'',
		'trigger': { 'stem': 'even' },
		'require': {
			'message': 'Cannot use \'even\'. Simply omit it or reword the sentence to get the right emphasis. See P1 Checklist section 17.',
		},
		'comment': 'See section 17 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use \'any\'',
		'trigger': { 'stem': 'any' },
		'require': {
			'message': 'Cannot use \'any\'. Simply use \'a\' instead. See P1 Checklist section 17.',
		},
		'comment': 'See section 17 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use \'really\'',
		'trigger': { 'token': 'really' },
		'require': {
			'message': 'Cannot use \'really\'. Use \'actually\', \'truly\', \'very\', or \'much\' instead.',
		},
		'comment': 'See section 1 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot say "X\'s own Y"',
		'trigger': { 'token': 'own' },
		'context': {
			'precededby': { 'tag': 'genitive_saxon', 'skip': { 'token': 'very' } },
		},
		'require': {
			'message': 'Cannot write "X\'s own Y". Simply omit \'own\' or write "X\'s _emphasized Y" if desired. See P1 Checklist section 17.',
		},
		'comment': 'See section 17 of the Phase 1 checklist',
	},
	{
		'name': 'Avoid vague units of time',
		'trigger': { 'stem': 'short|long|some' },
		'context': {
			'precededby': { 'token': 'For|for', 'skip': { 'token': 'a' } },
			'followedby': { 'stem': 'time' },
		},
		'suggest': {
			'message': 'Try using more specific units of time (eg. \'for many years\') or express it in a different way (eg. \'for much time\').',
		},
	},
	{
		'name': 'Suggest a comma after "One day..."',
		'trigger': { 'stem': 'day' },
		'context': {
			'precededby': { 'token': 'One' },
			'followedby': [{ 'token': 'that' }, { 'category': 'Noun' }],
		},
		'suggest': {
			'followedby': ',',
			'message': 'Add a comma after \'One day\' so the \'that\' doesn\'t confuse the Analyzer.',
		},
		'comment': 'The Analyzer messes up "One day that man...", but it works fine with a comma. TODO handle other phrases too?',
	},
	{
		'name': 'Expect a [ before a relative clause',
		'trigger': { 'tag': 'relativizer' },
		'context': {
			'precededby': { 'category': 'Noun' },
		},
		'require': {
			'precededby': '[',
			'message': 'Missing bracket before relative or complement clause.',
		},
	},
	{
		'name': 'Expect a [ before an adverbial clause',
		'trigger': { 'category': 'Adposition', 'usage': 'C' },
		'context': {
			'notprecededby': { 'token': '[' },
		},
		'require': {
			'precededby': '[',
			'message': 'Missing bracket before adverbial clause.',
		},
	},
	{
		'name': 'Expect a [ before a quote',
		'trigger': { 'token': ',' },
		'context': {
			'followedby': { 'token': '"' },
		},
		'require': {
			'followedby': '[',
			'message': 'Missing bracket before an opening quote',
		},
	},
	{
		'name': '\'so\' in an Adverbial clause should be followed by \'that\'',
		'trigger': { 'token': 'so', 'category': 'Adposition' },
		'context': {
			'notfollowedby': { 'token': 'that' },
		},
		'suggest': {
			'message': 'Use \'so-that\' so-that it doesn\'t get mistaken for the Conjunction.',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'around\'',
		'trigger': { 'token': 'around' },
		'context': {
			'precededby': { 'stem': 'turn', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'around\' must be hyphenated with the Verb (e.g. turn-around). DO NOT inflect the Verb (e.g. NOT turned-around).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'away\'',
		'trigger': { 'token': 'away' },
		'context': {
			'precededby': { 'stem': 'chase|take|walk', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'away\' must be hyphenated with the Verb (e.g. take-away). DO NOT inflect the Verb (e.g. NOT took-away).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'down\'',
		'trigger': { 'token': 'down' },
		'context': {
			'precededby': { 'stem': 'cut|knock|lie|run|sit|walk|write', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'down\' must be hyphenated with the Verb (e.g. run-down). DO NOT inflect the Verb (e.g. NOT ran-down).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'off\'',
		'trigger': { 'token': 'off' },
		'context': {
			'precededby': { 'stem': 'cut|pull|take', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'off\' must be hyphenated with the Verb (e.g. take-off). DO NOT inflect the Verb (e.g. NOT took-off).',
		},
	},
	{
		'name': 'Check for unhyphenated \'put on\' (clothes)',
		'trigger': { 'stem': 'on' },
		'context': {
			'precededby': { 'stem': 'put', 'category': 'Verb' },
			'followedby': { 'stem': 'clothes|glove|sandal|shirt|shoe' },
		},
		'require': {
			'message': '\'on\' must be hyphenated with the Verb (e.g. put-on).',
		},
		'comment': 'The clothing-related nouns must be present because we don\'t want this rule applying to \'put on\' in general',
	},
	{
		'name': 'Check for unhyphenated Verbs with \'out\'',
		'trigger': { 'token': 'out' },
		'context': {
			'precededby': { 'stem': 'come|cry|pour|pull', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'out\' must be hyphenated with the Verb (e.g. cry-out). DO NOT inflect the Verb (e.g. NOT cried-out).',
		},
	},
	{
		'name': 'Check for unhyphenated Verbs with \'up\'',
		'trigger': { 'token': 'up' },
		'context': {
			'precededby': { 'stem': 'go|pick|run|sit|stand|wake|walk', 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': '\'up\' must be hyphenated with the Verb (e.g. pick-up). DO NOT inflect the Verb (e.g. NOT picked-up).',
		},
	},
	{
		'name': 'Suggest "trouble _plural" instead of "troubles"',
		'trigger': { 'token': 'troubles' },
		'require': {
			'message': 'TBTA does not use the plural \'troubles\'. Use \'trouble _plural\' to indicate plurality.',
		},
	},
	{
		'name': 'Don\'t allow \'what\' as a relativizer',
		'trigger': { 'token': 'what' },
		'context': {
			'precededby': { 'token': '[' },
			'notfollowedby': { 'token': '?', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot use \'what\' as a relativizer. Use \'the thing [that...]\' instead.',
		},
		'comment': 'See section 0.41 of the Phase 1 checklist',
	},
	{
		'name': 'Warn about using \'what\' instead of \'which thing\'',
		'trigger': { 'token': 'What|what' },
		'suggest': {
			'message': '\'what\' always becomes \'which thing-A\'. Consider writing \'which X\' if you want something different.',
		},
		'comment': 'See section 0.41 of the Phase 1 checklist',
	},
	{
		'name': 'Don\'t allow \'where\' as a relativizer',
		'trigger': { 'token': 'where' },
		'context': {
			'precededby': { 'token': '[' },
			'notfollowedby': { 'token': '?', 'skip': 'all' },
		},
		'require': {
			'message': 'Cannot use \'where\' as a relativizer. Use \'the place [that...]\' instead.',
		},
		'comment': 'See section 0.8 of the Phase 1 checklist',
	},
	// TODO Look outside the subordinate clause for 'time'. Currently this falsely flags a 'when' adverbial clause. 
	// {
	// 	'name': 'Don\'t allow \'when\' as a relativizer',
	// 	'trigger': { 'token': 'when' },
	// 	'context': {
	// 		'precededby': { 'token': '[' },
	// 		'notfollowedby': { 'token': '?', 'skip': 'all' },
	// 	},
	// 	'require': {
	// 		'message': 'Cannot use \'when\' as a relativizer. Use \'the time [that...]\' instead.',
	// 	},
	// 	'comment': 'See section 0.8 of the Phase 1 checklist.',
	// },
	{
		'name': 'Don\'t allow \'whose\' as a relativizer',
		'trigger': { 'token': 'whose' },
		'require': {
			'message': 'Cannot use \'whose\'. Use \'X [who had...]\' instead. See P1 Checklist section 6.',
		},
		'comment': 'See section 6 of the Phase 1 checklist',
	},
	{
		'name': 'Use \'all of\' rather than \'all\' for non-generic Nouns',
		'trigger': { 'token': 'all' },
		'context': {
			'notfollowedby': [
				{ 'token': 'of|_generic', 'skip': [
					{ 'token': 'the|those|these' },
					{ 'category': 'Noun' },
				]},
			],
		},
		'suggest': {
			'followedby': 'of',
			'message': 'Use \'all of\' unless the modified Noun should be generic, in which case add \'_generic\' after the Noun. See P1 Checklist 0.17.',
		},
		'comment': 'See section 0.17 of the Phase 1 checklist',
	},
	{
		'name': 'Cannot use aspect auxilliaries (eg start) without another Verb',
		'trigger': { 'stem': 'start|stop|continue|finish' },
		'context': {
			'notfollowedby': { 'category': 'Verb', 'skip': 'all' },
		},
		'require': {
			'message': 'Must use start/stop/continue/finish with another Verb. See P1 Checklist 0.19.',
		},
		'comment': 'See section 0.19 of the Phase 1 checklist.',
	},
	{
		'name': 'Must use \'X is able to\' instead of \'X can\'',
		'trigger': { 'token': 'can' },
		'require': {
			'message': 'Use \'be able [to...]\' instead of \'can\'. See P1 Checklist 2.1.',
		},
		'comment': 'See section 2.1 of the Phase 1 checklist.',
	},
	{
		'name': 'Cannot use \'could\' unless in a \'so\' adverbial clause',
		'trigger': { 'token': 'could' },
		'context': {
			'notprecededby': [{ 'token': '[' }, { 'stem': 'so', 'skip': 'all' }],
		},
		'require': {
			'message': 'Use \'be able [to...]\' instead of \'could\', unless in a \'so-that\' clause. See P1 Checklist 2.1.',
		},
		'comment': 'See section 2.1 of the Phase 1 checklist.',
	},
	{
		'name': 'Cannot use \'is going to\' as a future marker',
		'trigger': { 'stem': 'go' },
		'context': {
			'followedby': [{ 'token': 'to' }, { 'category': 'Verb' }],
		},
		'require': {
			'message': 'Use \'will\' instead of \'going to\' to express future tense. See P1 Checklist 0.28.',
		},
		'comment': 'See section 0.28 of the Phase 1 checklist.',
	},
	{
		'name': 'Cannot use \'is to {Verb}\' as an obligation',
		'trigger': { 'stem': 'be' },
		'context': {
			'followedby': [{ 'token': 'to' }, { 'category': 'Verb' }],
		},
		'require': {
			'message': 'Use \'will\', \'must\', or \'should\' instead of \'is to...\' to express a future obligation.',
		},
	},
	{
		'name': 'Cannot use \'have to {Verb}\' as an obligation',
		'trigger': { 'stem': 'have' },
		'context': {
			'followedby': [{ 'token': 'to' }, { 'category': 'Verb' }],
		},
		'require': {
			'message': 'Use \'must\' or \'should\' instead of \'have to...\' to express an obligation.',
		},
	},
]

/** @type {BuiltInRule[]} */
const builtin_checker_rules = [
	{
		name: 'Check that level 3 words are within a (complex) alternate',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'level': '3' }),
			context: create_context_filter({ 'notprecededby': { 'token': '(complex)', 'skip': 'all' } }),
			action: create_token_modify_action(token =>{
				token.error_message = ERRORS.WORD_LEVEL_TOO_HIGH
			}),
		},
	},
	{
		name: 'Check that level 2 words are not on their own',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'level': '2' }),
			context: create_context_filter({}),
			action: create_token_modify_action(token =>{
				token.error_message = ERRORS.WORD_LEVEL_TOO_HIGH
			}),
		},
	},
	{
		name: 'Check word complexity level of pairings',
		comment: '',
		rule: {
			trigger: token => token.complex_pairing !== null,
			context: create_context_filter({}),
			action: create_token_modify_action(token =>{
				// the simple word should never be level 2 or 3
				if (check_token_level(is_level_complex)(token)) {
					token.error_message = ERRORS.WORD_LEVEL_TOO_HIGH
				}

				// the complex word should never be level 0 or 1
				if (token.complex_pairing && check_token_level(is_level_simple)(token.complex_pairing)) {
					token.complex_pairing.error_message = ERRORS.WORD_LEVEL_TOO_LOW
				}
			}),
		},
	},
	{
		name: 'Warn user if the word\'s complexity is ambiguous',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// Alert if the first result is complex and there are also non-complex results (including proper nouns - see 'ark')
				// If the first result is already simple, that will be selected by default and thus not ambiguous.
				// Level 2 and 3 words are treated differently, so a combination of the two should also be ambiguous - see 'kingdom'
				if (check_ambiguous_level(is_level(2))(token) || check_ambiguous_level(is_level(3))(token)) {
					token.suggest_message = ERRORS.AMBIGUOUS_LEVEL
				}

				const pairing = token.complex_pairing
				if (!pairing) {
					return
				}

				// Alert if the first result is simple and there are also complex results (see 'son')
				// If the first result is already complex, that will be selected by default and thus not ambiguous
				if (check_ambiguous_level(is_level_simple)(pairing)) {
					pairing.suggest_message = ERRORS.AMBIGUOUS_LEVEL
				}
			}),
		},
	},
	{
		name: 'Check for words not in the ontology',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				check_has_ontology_results(token)

				if (token.complex_pairing) {
					check_has_ontology_results(token.complex_pairing)
				}
				
				/**
				 * 
				 * @param {Token} token 
				 */
				function check_has_ontology_results(token) {
					if (token.lookup_results.some(result => result.concept)) {
						return
					}

					token.suggest_message = 'This word is not in the Ontology, or its form is not recognized. Consult the How-To document or consider using a different word.'
	
					if (token.lookup_results.some(result => result.how_to.length > 0)) {
						token.error_message = 'This word is not in the Ontology. Hover over the word for hints from the How-To document.'
					}
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
export function parse_checker_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])

	// one of these has to be present, but not both
	const require_json = rule_json['require']
	const suggest_json = rule_json['suggest']
	const action = require_json ? checker_require_action(require_json) : checker_suggest_action(suggest_json)

	return {
		trigger,
		context,
		action,
	}

	/**
	 * 
	 * @param {CheckerAction} require
	 * @returns {RuleAction}
	 */
	function checker_require_action(require) {
		return (tokens, trigger_index) => {
			// The action will have a precededby, followedby, or neither. Never both.
			if (require.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(require.precededby, { error: require.message }))
				return trigger_index + 2
			}
			if (require.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(require.followedby, { error: require.message }))
				return trigger_index + 2
			}

			tokens[trigger_index] = convert_to_error_token(tokens[trigger_index], require.message)
			return trigger_index + 1
		}
	}

	/**
	 * 
	 * @param {CheckerAction} suggest
	 * @returns {RuleAction}
	 */
	function checker_suggest_action(suggest) {
		return (tokens, trigger_index) => {
			// The action will have a precededby, followedby, or neither. Never both.
			if (suggest.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(suggest.precededby, { suggest: suggest.message }))
				return trigger_index + 2
			}
			if (suggest.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(suggest.followedby, { suggest: suggest.message }))
				return trigger_index + 2
			}

			tokens[trigger_index] = { ...tokens[trigger_index], suggest_message: suggest.message }
			return trigger_index + 1
		}
	}
}

export const CHECKER_RULES = builtin_checker_rules.map(({ rule }) => rule).concat(checker_rules_json.map(parse_checker_rule))

/**
 * 
 * @param {(result: OntologyResult?) => boolean} level_check 
 * @returns {TokenFilter}
 */
function check_token_level(level_check) {
	return token => {
		return token.lookup_results.length > 0
			&& token.lookup_results.every(result => level_check(result.concept))
	}
}
/**
 * 
 * @param {(result: OntologyResult?) => boolean} level_check 
 * @returns {TokenFilter}
 */
function check_ambiguous_level(level_check) {
	return token => {
		return token.lookup_results.length > 0
			&& level_check(token.lookup_results[0].concept)
			&& token.lookup_results.filter(result => result.concept).some(result => !level_check(result.concept))
	}
}

/**
 * 
 * @param {number} level 
 * @returns {(concept: OntologyResult?) => boolean}
 */
function is_level(level) {
	return concept => concept?.level === level
}

/**
 * 
 * @param {OntologyResult?} result 
 */
function is_level_simple(result) {
	return is_level(0)(result) || is_level(1)(result)
}

/**
 * 
 * @param {OntologyResult?} result 
 */
function is_level_complex(result) {
	return is_level(2)(result) || is_level(3)(result)
}
