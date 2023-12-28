import {pipe} from '$lib/pipeline'
import {REGEXES} from '$lib/regexes'

/**
 * @param {CheckedToken[]} tokens
 * @returns {CheckedToken[]}
 */
export function check_balancing(tokens) {
	// prettier-ignore
	return pipe(
		check_for_unbalanced_parentheses,
		check_for_unbalanced_brackets
	)(tokens)
}

/**
 * Parentheses should always be balanced and in order within a token.
 *
 * @param {CheckedToken[]} tokens
 * @returns {CheckedToken[]}
 */
function check_for_unbalanced_parentheses(tokens) {
	return tokens.map(({token, message}) => ({
		token,
		// not overwriting existing messages because they've been corrected this check will occur again
		message: message || check_syntax(token),
	}))

	/**
	 * @param {Token} token
	 * @returns {string} error message or ''
	 */
	function check_syntax(token) {
		const open_count = token.match(/\(/g)?.length || 0
		const close_count = token.match(/\)/g)?.length || 0

		if (open_count > close_count) return 'Missing a closing parenthesis.'
		if (open_count < close_count) return 'Missing an opening parenthesis.'

		if (token.indexOf(')') < token.indexOf('(')) return 'Parentheses appear out of order.'

		return ''
	}
}

/**
 * @param {CheckedToken[]} checked_tokens
 * @returns {CheckedToken[]}
 */
function check_for_unbalanced_brackets(checked_tokens) {
	const all_brackets = stringify_brackets(checked_tokens)

	const tracker = []
	for (const bracket of all_brackets) {
		if (bracket === '[') {
			tracker.push(bracket)
		} else {
			if (tracker.length === 0) {
				checked_tokens = [{token: '[', message: 'Missing an opening bracket'}, ...checked_tokens]
			} else {
				tracker.pop()
			}
		}
	}

	while (tracker.length > 0) {
		checked_tokens.push({token: ']', message: 'Missing a closing bracket'})

		tracker.pop()
	}

	return checked_tokens

	/**
	 * @param {CheckedToken[]} checked_tokens
	 * @returns {string} all brackets in order
	 */
	function stringify_brackets(checked_tokens) {
		return checked_tokens
			.filter(({token}) => REGEXES.OPENING_OR_CLOSING_BRACKET.test(token))
			.map(({token}) => token.match(REGEXES.OPENING_OR_CLOSING_BRACKET_G)?.join(''))
			.join('')
	}
}
