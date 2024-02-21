import {parse_checker_rule} from "./rules_parser"

// TODO store these in the database
const checker_rules_json = [
	// {
	// 	'name': 'Expect a [ before a relative clause',
	// 	'trigger': { 'token': 'that|who|whom|which' },
	// 	'context': {
	// 		'precededby': { 'category': 'Noun' },
	// 	},
	// 	'require': {
	// 		'precededby': '[',
	// 		'message': 'Missing bracket before relative clause.',
	// 	}
	// },
	{
		'name': 'Expect a [ before a quote',
		'trigger': { 'token': ',' },
		'context': {
			'followedby': { 'token': '"' }
		},
		'require': {
			'followedby': '[',
			'message': 'Missing bracket before an opening quote',
		}
	},
]

export const CHECKER_RULES = checker_rules_json.map(parse_checker_rule)
