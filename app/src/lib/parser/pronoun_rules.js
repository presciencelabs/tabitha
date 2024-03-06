import {convert_to_error_token, token_has_error} from './token'

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

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[]}
 */
export function check_for_pronouns(tokens) {
	return tokens.map(check)

	/**
	 * 
	 * @param {Token} token 
	 * @returns {Token}
	 */
	function check(token) {
		if (token_has_error(token)) {
			return token
		}

		const normalized_token = token.token.toLowerCase()

		if (PRONOUN_MESSAGES.has(normalized_token)) {
			// @ts-ignore
			return convert_to_error_token(token, PRONOUN_MESSAGES.get(normalized_token))
		}

		return check_pronoun(token)
	}

	/**
	 * 
	 * @param {Token} token 
	 * @returns {Token}
	 */
	function check_pronoun(token) {
		if (!token.pronoun) {
			return token
		}

		const pronoun = token.pronoun.token
		const normalized_pronoun = pronoun.toLowerCase()
		if (PRONOUN_TAGS.has(normalized_pronoun)) {
			// @ts-ignore
			return {...token, tag: PRONOUN_TAGS.get(normalized_pronoun)}
		} else if (PRONOUN_MESSAGES.has(normalized_pronoun)) {
			// @ts-ignore
			token.pronoun = convert_to_error_token(token.pronoun, PRONOUN_MESSAGES.get(normalized_pronoun))
		} else {
			token.pronoun = convert_to_error_token(token.pronoun, `Unrecognized pronoun "${pronoun}"`)
		}
		return token
	}
}