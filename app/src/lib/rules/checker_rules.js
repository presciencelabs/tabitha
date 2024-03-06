import {parse_checker_rule} from './rules_parser'

const checker_rules_json = [
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
			'message': 'If possible, consider using \'already\' or just the simple past instead of the perfect with \'have\'.',
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
]

export const CHECKER_RULES = checker_rules_json.map(parse_checker_rule)
