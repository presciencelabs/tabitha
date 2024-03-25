import { CLAUSE_NOTATIONS } from './clause_notations'
import { FUNCTION_WORDS } from './function_words'
import { REGEXES } from '$lib/regexes'
import { TOKEN_TYPE, create_token } from './token'
import { ERRORS } from './error_messages'

/**
 * 
 * @param {string} text 
 * @returns {string}
 */
function normalize_input(text) {
	return text.replaceAll(/[“”]/g, '"').replaceAll(/’/g, '\'')
}

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function tokenize_input(text = '') {
	text = normalize_input(text)

	/** @type {Array<[() => boolean, () => Token]>} */
	const parsers = [
		[() => match(REGEXES.WORD_START_CHAR), word],
		[() => match(REGEXES.OPENING_PAREN), clause_notation],
		[() => match(/_/), underscore_notation],
		[() => match_two(/\.\d/), decimal_number],
		[() => match(/:/), colon],
		[() => match(/[["]/), opening_punctuation],
		[() => match(/[.,?!\]]/), closing_punctuation],
	]

	const tokens = []
	let token_start = 0

	let i = 0
	while (!is_at_end()) {
		token_start = i
		if (match(REGEXES.ANY_WHITESPACE)) {
			continue
		}
		const parser = parsers.find(([check]) => check())?.[1] ?? invalid_opening_char
		tokens.push(parser())
	}

	return tokens

	function word() {
		eat(REGEXES.WORD_CHAR)
		if (match(REGEXES.OPENING_PAREN)) {
			return pronoun_referent()

		} else if (match(REGEXES.FORWARD_SLASH)) {
			return pairing()

		} else if (match_two(/\.\d/)) {
			// may be a decimal number like 2.5
			return decimal_number()

		} else {
			// any other word
			return check_boundary_for_token(word_token)
		}
	}

	function pronoun_referent() {
		eat(REGEXES.WORD_CHAR)
		if (!match(REGEXES.CLOSING_PAREN)) {
			return error_token(ERRORS.MISSING_CLOSING_PAREN)
		}
		return check_boundary_for_token(pronoun_referent_token)
	}

	function pairing() {
		if (!match(REGEXES.WORD_START_CHAR)) {
			// simple/
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.INVALID_PAIRING_SYNTAX)
		}
		// simple/complex
		eat(REGEXES.WORD_CHAR)
		return check_boundary_for_token(pairing_token)
	}

	function decimal_number() {
		eat(/\d/)
		return check_boundary_for_token(word_token)
	}

	function colon() {
		if (peek_match(/\d/)) {
			return simple_token(TOKEN_TYPE.PUNCTUATION)
		}
		return check_boundary_for_token(word_token)
	}

	function clause_notation() {
		// any non-boundary character can go between the parentheses
		eat_until(REGEXES.OR(REGEXES.TOKEN_END_BOUNDARY, REGEXES.CLOSING_PAREN))
		if (!match(REGEXES.CLOSING_PAREN)) {
			// (imp
			return error_token(ERRORS.MISSING_CLOSING_PAREN)

		} else if (!CLAUSE_NOTATIONS.includes(collect_text())) {
			// (invalid-notation)
			return error_token(ERRORS.UNRECOGNIZED_CLAUSE_NOTATION)
		}

		return check_boundary_for_token(() => simple_token(TOKEN_TYPE.NOTE))
	}

	function underscore_notation() {
		// anything can go after the underscore
		// in addition to the normal boundary punctuation, [ can follow as well
		eat_until(REGEXES.OR(REGEXES.TOKEN_END_BOUNDARY, REGEXES.OPENING_BRACKET))
		return simple_token(TOKEN_TYPE.NOTE)
	}

	function closing_punctuation() {
		// Cannot be followed directly by text or [
		return check_boundary_for_token(() => simple_token(TOKEN_TYPE.PUNCTUATION))
	}

	function opening_punctuation() {
		// Can be followed by anything
		return simple_token(TOKEN_TYPE.PUNCTUATION)
	}

	/**
	 * @param {(string: text) => Token} token_if_valid
	 * @returns {Token}
	 */
	function check_boundary_for_token(token_if_valid) {
		if (!is_at_end() && !peek_match(REGEXES.TOKEN_END_BOUNDARY)) {
			return invalid_closing_char()
		}

		return token_if_valid(collect_text())
	}

	function invalid_opening_char() {
		const char = peek()
		eat_until(REGEXES.TOKEN_END_BOUNDARY)

		const messages = new Map([
			[')', ERRORS.MISSING_OPENING_PAREN],
			['/', ERRORS.INVALID_PAIRING_SYNTAX],
		])

		return error_token(messages.get(char) || ERRORS.UNRECOGNIZED_CHAR)
	}

	function invalid_closing_char() {
		if (match(REGEXES.OPENING_BRACKET)) {
			// token[ .[ ][ etc
			return error_token(ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET)

		} else if (match(REGEXES.CLOSING_PAREN)) {
			// token) .)
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.MISSING_OPENING_PAREN)

		} else if (match_two(/_\w/)) {
			// token_note ._note
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.NO_SPACE_BEFORE_UNDERSCORE)

		} else {
			// .token token_ ?token
			const text = collect_text()
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.INVALID_TOKEN_END(text))
		}
	}

	function collect_text() {
		return text.substring(token_start, i)
	}

	/**
	 * @param {string} token 
	 * @returns {Token}
	 */
	function word_token(token) {
		return get_function_word(token) || lookup_token(token)
	}

	/**
	 * 
	 * @param {string} token 
	 * @returns {Token|null}
	 */
	function get_function_word(token) {
		const word_function = FUNCTION_WORDS.get(token.toLowerCase())
		return word_function ? create_token(token, TOKEN_TYPE.FUNCTION_WORD, { tag: word_function }) : null
	}

	/**
	 * @param {string} text
	 * @returns {Token}
	 */
	function lookup_token(text) {
		const lookup_match = text.match(REGEXES.EXTRACT_LOOKUP_TERM)

		// combine stem and sense
		// @ts-ignore the stem will always be there
		const stem = lookup_match?.[1]
		const sense = lookup_match?.[2] ?? ''
		return create_token(text, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: stem, specified_sense: sense })
	}

	/**
	 * @param {string} token 
	 * @returns {Token}
	 */
	function pairing_token(token) {
		const [left, right] = token.split('/').map(lookup_token)
		left.complex_pairing = right
		return left
	}

	/**
	 * @param {string} token 
	 * @returns {Token}
	 */
	function pronoun_referent_token(token) {
		/** @type {RegExpMatchArray} */
		// @ts-ignore the match will always succeed here
		const referent_match = token.match(REGEXES.EXTRACT_PRONOUN_REFERENT)

		const [pronoun_text, referent_text] = [referent_match[1], referent_match[2]]
		const referent = lookup_token(referent_text)
		const pronoun = create_token(pronoun_text, TOKEN_TYPE.FUNCTION_WORD)
		referent.pronoun = pronoun
		return referent
	}

	/**
	 * @param {string} message
	 * @returns {Token}
	 */
	function error_token(message) {
		return create_token(collect_text(), TOKEN_TYPE.NOTE, { error: message })
	}

	/**
	 * @param {TokenType} type
	 * @returns {Token}
	 */
	function simple_token(type) {
		return create_token(collect_text(), type)
	}

	function peek() {
		return text[i]
	}

	/**
	 * peek_match() checks if the current character matches the given regex without advancing
	 * @param {RegExp} regex
	 */
	function peek_match(regex) {
		return !is_at_end() && peek().match(regex)
	}

	/**
	 * match() advances if the current character matches the given regex
	 * @param {RegExp} regex
	 */
	function match(regex) {
		if (peek_match(regex)) {
			advance()
			return true
		}
		return false
	}

	/**
	 * match_two() advances if the next two characters match the given regex
	 * @param {RegExp} regex
	 */
	function match_two(regex) {
		if (i < text.length - 1 && (text[i] + text[i + 1]).match(regex)) {
			i += 2
			return true
		}

		return false
	}

	/**
	 * eat() advances greedily until a character does not match the given regex
	 * @param {RegExp} regex
	 */
	function eat(regex) {
		while (peek_match(regex)) {
			advance()
		}
	}

	/**
	 * eat_until() advances greedily until a character matches the given regex
	 * @param {RegExp} regex
	 */
	function eat_until(regex) {
		while (!is_at_end() && !peek().match(regex)) {
			advance()
		}
	}

	function advance() {
		i++
	}

	function is_at_end() {
		return i >= text.length
	}
}
