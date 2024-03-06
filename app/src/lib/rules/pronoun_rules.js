import {create_context_filter, create_token_map_action} from './rules_parser'
import {TOKEN_TYPE, convert_to_error_token, token_has_error} from '../parser/token'

const FIRST_PERSON = ['i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves']
const SECOND_PERSON = ['you', 'your', 'yourself', 'yourselves']
const THIRD_PERSON = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']

const PRONOUN_MESSAGES = new Map([
	['mine', '"mine" should be replaced with "my() X", e.g., That book is my(Paul\'s) book.'],
	['ours', '"ours" should be replaced with "our() X", e.g., That book is our(Paul\'s) book.'],
	['yours', '"yours" should be replaced with "your() X", e.g., That book is your(Paul\'s) book.'],
	['each-other', '"each-other" requires its respective Noun in parentheses, e.g., each-other(people).'],
])
FIRST_PERSON.forEach(p => PRONOUN_MESSAGES.set(p, 'First person pronouns require their respective Noun in parentheses, e.g., I(Paul).'))
SECOND_PERSON.forEach(p => PRONOUN_MESSAGES.set(p, 'Second person pronouns require their respective Noun in parentheses, e.g., you(Paul).'))
THIRD_PERSON.forEach(p => PRONOUN_MESSAGES.set(p, 'Third person pronouns should be replaced with the Noun they represent, e.g., Paul (instead of him).'))

export const PRONOUN_TAGS = new Map([
	['i', 'first_person|singular'],
	['me', 'first_person|singular'],
	['my', 'first_person|singular'],
	['myself', 'first_person|singular|reflexive'],
	['we', 'first_person|plural'],
	['us', 'first_person|plural'],
	['our', 'first_person|plural'],
	['ourselves', 'first_person|plural|reflexive'],
	['you', 'second_person'],
	['your', 'second_person'],
	['yourself', 'second_person|singular|reflexive'],
	['yourselves', 'second_person|plural|reflexive'],
	['each-other', 'reciprocal'],
])

/** @type {BuiltInRule[]} */
const builtin_pronoun_rules = [
	{
		'name': 'Check for invalid stand-alone pronouns',
		'comment': '',
		'rule': {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !token_has_error(token),
			context: create_context_filter({}),
			action: create_token_map_action(token => {
				const normalized_token = token.token.toLowerCase()

				if (PRONOUN_MESSAGES.has(normalized_token)) {
					// @ts-ignore
					return convert_to_error_token(token, PRONOUN_MESSAGES.get(normalized_token))
				}
				return token
			}),
		},
	},
	{
		'name': 'Tag valid pronoun referents and check for invalid ones',
		'comment': '',
		'rule': {
			trigger: token => token.pronoun !== null,
			context: create_context_filter({}),
			action: create_token_map_action(token => {
				/** @type {Token} */
				// @ts-ignore
				const pronoun = token.pronoun
				const normalized_pronoun = pronoun.token.toLowerCase()

				let tag, message
				if (tag = PRONOUN_TAGS.get(normalized_pronoun)) {
					return {...token, tag}
				} else if (message = PRONOUN_MESSAGES.get(normalized_pronoun)) {
					token.pronoun = convert_to_error_token(pronoun, message)
				} else {
					token.pronoun = convert_to_error_token(pronoun, `Unrecognized pronoun "${pronoun.token}"`)
				}
				return token
			}),
		},
	},
]

export const PRONOUN_RULES = builtin_pronoun_rules.map(({rule}) => rule)
