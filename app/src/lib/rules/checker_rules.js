import {parse_checker_rule} from './rules_parser'

// TODO store these in the database
const checker_rules_json = [
	{
		'name': 'Expect a [ before a relative clause',
		'trigger': { 'token': 'that|who|whom|which' },
		'context': {
			'precededby': { 'category': 'Noun' },
		},
		'require': {
			'precededby': '[',
			'message': 'Missing bracket before relative clause.',
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
	// TODO Won't work now that skip doesn't look in subordinate clauses.
	// Re-add when clauses are tagged for function
	// {
	// 	'name': 'Speak does not use quotes',
	// 	'trigger': { 'stem': 'speak' },
	// 	'context': {
	// 		'followedby': { 'token': '"', 'skip': 'all' },
	// 	},
	// 	'require': {
	// 		'message': '\'Speak\' cannot be used with a direct quote',
	// 	},
	// },
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
]

export const CHECKER_RULES = checker_rules_json.map(parse_checker_rule)
