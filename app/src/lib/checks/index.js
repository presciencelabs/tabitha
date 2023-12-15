/**
 * @param {string} sentence
 *
 * @returns {CheckedToken[]}
 */
export function check(sentence) {
	const ANY_WHITESPACE = /\s+/
	const tokens = sentence.split(ANY_WHITESPACE).filter(not_empty)

	const checked_tokens = tokens.map(convert_to_checked_token)

	return check_for_unbalanced_brackets(checked_tokens)

	/**
	 * @param {string} token
	 * @returns {CheckedToken}
	 */
	function convert_to_checked_token(token) {
		// prettier-ignore
		const checks = [
			check_bracket_syntax,
			check_for_unbalanced_parentheses,
			check_for_pronouns,
			check_underscore_syntax,
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
 *	valid: good (good) (good)(good) (good(good))
 *	invalid: (bad )bad( bad) (bad(bad) bad)
 */
function check_for_unbalanced_parentheses(token) {
	const open_count = token.match(/\(/g)?.length || 0
	const close_count = token.match(/\)/g)?.length || 0

	if (open_count > close_count) {
		return 'Missing a closing parenthesis.'
	}

	if (open_count < close_count) {
		return 'Missing an opening parenthesis.'
	}

	if (token.indexOf(')') < token.indexOf('(')) {
		return 'Closing parenthesis appears before the opening parenthesis.'
	}

	return ''
}

/**
 * opening brackets must have a space before them
 *
 * @param {string} token
 *
 * @returns {string} error message or ''
 *
 * valid: [ [good
 * invalid: [[bad]] bad[ [bad[bad]]
 */
function check_bracket_syntax(token) {
	const NON_WHITESPACE_BEFORE_BRACKET = /\S\[/g

	// prettier-ignore
	return token.includes('[') && NON_WHITESPACE_BEFORE_BRACKET.test(token)
			? 'Opening brackets must have a space before them.'
			: ''
}

/**
 * @param {CheckedToken[]} checked_tokens
 *
 * @returns {CheckedToken[]}
 */
function check_for_unbalanced_brackets(checked_tokens) {
	/**
	 * @typedef CountTracker
	 * @property {number} open
	 * @property {number} close
	 */
	/** @type {CountTracker} */
	const count_tracker = checked_tokens.reduce(sum, {open: 0, close: 0})

	if (count_tracker.open === count_tracker.close) {
		return checked_tokens
	}

	return add_missing_token(checked_tokens)(count_tracker)

	/**
	 * @param {CountTracker} tracker
	 * @param {CheckedToken} param1
	 *
	 * @returns {CountTracker}
	 */
	function sum(tracker, {token}) {
		const open_count = token.match(/\[/g)?.length ?? 0
		const close_count = token.match(/\]/g)?.length ?? 0

		tracker.open += open_count
		tracker.close += close_count

		return tracker
	}

	/**
	 * @param {CheckedToken[]} checked_tokens
	 *
	 * @returns {(tracker: CountTracker) => CheckedToken[]}
	 */
	function add_missing_token(checked_tokens) {
		const open_token = {token: '[', messages: ['Missing a closing bracket.']}
		const close_token = {token: ']', messages: ['Missing an opening bracket.']}

		// prettier-ignore
		return ({open, close}) => open < close ? [open_token, ...checked_tokens]
															: [...checked_tokens, close_token]
	}
}

/**
 * underscores must have a space before and after the word connected to them, e.g., ⎕_implicit⎕
 *
 * @param {string} token
 *
 * @returns {string} error message or ''
 *
 * valid: _implicit _paragraph _explainName
 * invalid: x_implicit _implicit. _implicit_ __implicit _implicit, _implicit; _implicit– _implicit-
 * questionable: _implicitX (if this is invalid, that means a list of finite "specialized notations" will be required)
 */
function check_underscore_syntax(token) {
	const NON_WHITESPACE_BEFORE_UNDERSCORE = /\S_/
	if (NON_WHITESPACE_BEFORE_UNDERSCORE.test(token)) {
		return 'Specialized notation can only have a space before the underscore, e.g., ⎕_implicit'
	}

	const NON_ALPHANUMERIC_AT_END = /_\w+[\W_]$/
	if (NON_ALPHANUMERIC_AT_END.test(token)) {
		return 'Specialized notation must have a space after the underscore, e.g., _implicit⎕'
	}

	return ''
}