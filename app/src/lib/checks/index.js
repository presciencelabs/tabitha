/**
 * @param {string} sentence
 *
 * @returns {CheckedToken[]}
 */
export function tokenize(sentence) {
	const tokens = sentence.split(' ').filter(not_empty)

	return tokens.map(convert_to_checked_token)

	/**
	 * @param {string} token
	 * @returns {CheckedToken}
	 */
	function convert_to_checked_token(token) {
		const message = check_for_pronouns(token)

		return {
			token,
			message,
		}
	}
}

function not_empty(text = '') {
	return !!text.trim()
}

/** @type {Map<string[], string>} */
const pronoun_rules = new Map()

const FIRST_PERSON = ['I', 'i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']
const SECOND_PERSON = ['you', 'your', 'yours', 'yourself']
const THIRD_PERSON = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']

pronoun_rules.set(FIRST_PERSON, 'First person pronouns require their respective Noun in parentheses, e.g., I(Paul).')
pronoun_rules.set(SECOND_PERSON, 'Second person pronouns require their respective Noun in parentheses, e.g., you(Paul).')
pronoun_rules.set(THIRD_PERSON, 'Third person pronouns should be replaced with the Noun they represent, e.g., Paul (instead of him).')

/**
 * @param {string} token
 *
 * @returns {string} error message or ''
 */
function check_for_pronouns(token) {
	for (const [pronouns, message] of pronoun_rules) {
		if (pronouns.includes(token.toLowerCase())) {
			return message
		}
	}

	return ''
}
