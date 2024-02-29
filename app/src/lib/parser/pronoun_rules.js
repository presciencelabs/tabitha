const FIRST_PERSON = ['i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves']
const SECOND_PERSON = ['you', 'your', 'yourself', 'yourselves']
const THIRD_PERSON = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']

/** @type {Map<string, string>} */
export const PRONOUN_MESSAGES = new Map([
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