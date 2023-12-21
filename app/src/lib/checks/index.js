/**
 * @param {string} sentence
 *
 * @returns {CheckedToken[]}
 */
export function check(sentence) {
	const ANY_WHITESPACE = /\s+/
	const tokens = sentence.split(ANY_WHITESPACE).filter(not_empty)

	let checked_tokens = tokens.map(convert_to_checked_token)

	checked_tokens = isolate_punctuation(checked_tokens)

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
		if (token === '[') {
			tracker.open += 1
		} else if (token === ']') {
			tracker.close += 1
		}
		return tracker
	}

	/**
	 * @param {CheckedToken[]} checked_tokens
	 *
	 * @returns {(tracker: CountTracker) => CheckedToken[]}
	 */
	function add_missing_token(checked_tokens) {
		const open_token = {token: '[', messages: ['Missing an opening bracket.']}
		const close_token = {token: ']', messages: ['Missing a closing bracket.']}

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

/**
 * @param {CheckedToken[]} checked_tokens
 *
 * @returns {CheckedToken[]}
 */
function isolate_punctuation(checked_tokens) {
	/** @type {CheckedToken[]} */
	const isolated_from_front_of_token = checked_tokens.reduce(parse_front_of_token, [])

	/** @type {CheckedToken[]} */
	const isolated = isolated_from_front_of_token.reduce(parse_back_of_token, [])

	return isolated

	/**
	 * @param {CheckedToken[]} augmented_tokens
	 * @param {CheckedToken} next_token
	 *
	 * @returns {CheckedToken[]}
	 */
	function parse_front_of_token(augmented_tokens, {token, messages}) {
		// at this time, '[' is the only "opening" punctuation to be parsed

		// early exit if the token isn't relevant, e.g., 'some_token'
		if (token[0] !== '[') {
			augmented_tokens.push({token, messages})

			return augmented_tokens
		}

		//
		// split '[some_token' into two tokens => '[' 'some_token'
		//

		// '['
		augmented_tokens.push({token: '[', messages: []})

		// 'some_token' (or possibly empty, e.g., if the incoming token was just '[')
		const bare_token = token.slice(1)
		!!bare_token && augmented_tokens.push({token: bare_token, messages})

		return augmented_tokens
	}

	/**
	 * @param {CheckedToken[]} augmented_tokens
	 * @param {CheckedToken} next_token
	 *
	 * @returns {CheckedToken[]}
	 */
	function parse_back_of_token(augmented_tokens, {token, messages}) {
		// at this time, ']', ',', '.' are the only "closing" punctuations to be parsed, will need to tweak RE if others need to be separated
		//
		// [\],.]+: Matches one or more of these ',', ']', or '.'
		// [^\],.]+: Matches one or more characters that are NOT ',', ']', or '.'
		const PUNCT_OF_INTEREST = /^([^\],.]+)+([\],.]+)$/

		// match these patterns:
		// 	token]
		// 	token]]
		// 	token,
		// 	token.
		// 	token]]].
		// 	teaching/preaching]].
		//
		// not these:
		//		token
		//		(token)
		const matches = token.match(PUNCT_OF_INTEREST)

		// early exit if the token isn't relevant, e.g., 'some_token'
		if (matches === null) {
			augmented_tokens.push({token, messages})

			return augmented_tokens
		}

		//
		// split 'some_token]', 'some_token].', 'some_token]],', ...(many permutations) into multiple tokens
		//

		// 'some_token'
		const bare_token = matches[1]
		augmented_tokens.push({token: bare_token, messages})

		// split ']', '].', ']],', ...(many permutations) into multiple tokens
		matches[2].split('').forEach(punct => augmented_tokens.push({token: punct, messages: []}))

		return augmented_tokens
	}
}
