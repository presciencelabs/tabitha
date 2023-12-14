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
		// prettier-ignore
		const checks = [
			check_for_unbalanced_parentheses,
			check_for_pronouns
		]

		const messages = checks.map(check => check(token)).filter(not_empty)

		return {
			token,
			messages,
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
	const normalized_token = normalize(token)

	for (const [pronouns, message] of pronoun_rules) {
		if (pronouns.includes(normalized_token)) {
			return message
		}
	}

	return ''

	/** @param {string} raw_token */
	function normalize(raw_token) {
		// prettier-ignore
		const normalized = raw_token
									.toLowerCase() // catches YOU
									.trim() 			// catches you\n

		const match = normalized.match(/\((\w+)\)/) // catches (you)

		return match ? match[1] : normalized
	}
}

/**
 * @param {string} token
 *
 * @returns {string} error message or ''
 *
 * scenarios:
 * 	valid: good (good) (good)(good) (good(good))
 * 	invalid: (bad )bad( bad) (bad(bad) bad)
 */
function check_for_unbalanced_parentheses(token) {
	const open_count = token.match(/\(/g)?.length || 0
	const close_count = token.match(/\)/g)?.length || 0

	if (open_count > close_count) {
		return 'Missing a closing parenthesis.'
	} else if (open_count < close_count) {
		return 'Missing an opening parenthesis.'
	} else if (token.indexOf(')') < token.indexOf('(')) {
		return 'Closing parenthesis appears before the opening parenthesis.'
	}

	return ''
}
