import {ERRORS} from '$lib/parser/error_messages'
import {TOKEN_TYPE, check_token_lookup, convert_to_error_token, create_added_token} from '$lib/parser/token'
import {create_context_filter, create_token_filter, create_token_modify_action} from './rules_parser'

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
			'notprecededby': { 'token': '[' },
		},
		'require': {
			'message': 'Cannot have multiple verbs in the same clause. Check for an unbracketed subordinate clause or consider splitting the sentence.',
		},
		'comment': 'Check for a [ error token in case an earlier check already identified a potential subordinate clause.',
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
		'name': 'Avoid using \'way\'',
		'trigger': { 'stem': 'way' },
		'suggest': {
			'message': 'Consider rewording to avoid the use of \'way\'. If that is impossible, you can still use it in the sense of means or method.',
		},
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
				if (check_token_lookup(is_level_complex)(token)) {
					token.error_message = ERRORS.WORD_LEVEL_TOO_HIGH
				}

				// the complex word should never be level 0 or 1 (right?)
				if (token.complex_pairing && check_token_lookup(is_level_simple)(token.complex_pairing)) {
					token.complex_pairing.error_message = ERRORS.WORD_LEVEL_TOO_LOW
				}
			}),
		},
	},
	{
		name: 'Warn user if the word\'s complexity is ambiguous',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && token.lookup_results.length > 0,
			context: create_context_filter({}),
			action: create_token_modify_action(token => {
				// Alert if the first result is complex and there are also non-complex results (including proper nouns - see 'ark')
				// If the first result is already simple, that will be selected by default and thus not ambiguous
				if (is_level_complex(token.lookup_results[0]) && token.lookup_results.some(result => !is_level_complex(result))) {
					token.suggest_message = ERRORS.AMBIGUOUS_LEVEL
				}

				const pairing = token.complex_pairing
				if (!pairing || pairing.lookup_results.length === 0) {
					return
				}

				// Alert if the first result is simple and there are also complex results (see 'son')
				// If the first result is already complex, that will be selected by default and thus not ambiguous
				if (is_level_simple(pairing.lookup_results[0]) && pairing.lookup_results.some(result => !is_level_simple(result))) {
					pairing.suggest_message = ERRORS.AMBIGUOUS_LEVEL
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
				tokens.splice(trigger_index, 0, create_added_token(require.precededby, {error: require.message}))
				return trigger_index + 2
			}
			if (require.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(require.followedby, {error: require.message}))
				return trigger_index + 2
			}

			tokens[trigger_index] = convert_to_error_token(tokens[trigger_index], require.message)
			return trigger_index + 1
		}
	}

	/**
	 * suggest only applies on the trigger token (for now)
	 * @param {CheckerAction} suggest
	 * @returns {RuleAction}
	 */
	function checker_suggest_action(suggest) {
		return (tokens, trigger_index) => {
			// The action will have a precededby, followedby, or neither. Never both.
			if (suggest.precededby) {
				tokens.splice(trigger_index, 0, create_added_token(suggest.precededby, {suggest: suggest.message}))
				return trigger_index + 2
			}
			if (suggest.followedby) {
				tokens.splice(trigger_index + 1, 0, create_added_token(suggest.followedby, {suggest: suggest.message}))
				return trigger_index + 2
			}

			tokens[trigger_index] = {...tokens[trigger_index], suggest_message: suggest.message}
			return trigger_index + 1
		}
	}
}

export const CHECKER_RULES = builtin_checker_rules.map(({rule}) => rule).concat(checker_rules_json.map(parse_checker_rule))

/**
 * 
 * @param {OntologyResult} result 
 */
function is_level_simple(result) {
	return result.level === 0 || result.level === 1
}

/**
 * 
 * @param {OntologyResult} result 
 */
function is_level_complex(result) {
	return result.level === 2 || result.level === 3
}
