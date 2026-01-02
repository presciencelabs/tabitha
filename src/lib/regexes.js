// useful references:
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
//
// playground:  https://regexr.com
// visualizer:  https://jex.im/regulex

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#s
const ANY_WHITESPACE = /\s/
const OPENING_BRACKET = /\[/
const OPENING_PAREN = /\(/
const CLOSING_PAREN = /\)/
const FORWARD_SLASH = /\//
const PIPE = /\|/

// Could be you(son) your(son's) your(sons') you(son-C) your(son's-C) your(sons'-C)
const EXTRACT_PRONOUN_REFERENT = /^(.+)\(([\w'-]+)\)$/

// Could be son son's sons' son-C son's-C sons'-C
// This pulls out the stem and sense, which will then need to be put back together
const EXTRACT_LOOKUP_TERM = /^(.+?)(?:'s|')?(?:-([A-Z]))?$/
const HAS_POSSESSIVE = /^(.+?)('s|')(-[A-Z])?$/
const HAS_SENSE = /^(.+?)(-[A-Z])$/
const EXTRACT_STEM_AND_SENSE = /^(.+?)(?:-([A-Z]))?$/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class
const SENTENCE_ENDING_PUNCTUATION = /^[.?!]/
const CLAUSE_ENDING_PUNCTUATION = /[\]"]/

const TOKEN_END_BOUNDARY = /[\s.,!?:"\]]/
const WORD_START_CHAR = /[a-zA-Z0-9-]/
const WORD_CHAR = /[a-zA-Z0-9-']/
const STARTS_LOWERCASE = /^[a-z.]/	// include '.' for cases like 'half'->'.5'

/**
 * @param {RegExp} regex1
 * @param {RegExp} regex2
 */
const OR = function (regex1, regex2) {
	return new RegExp(`${regex1.source}|${regex2.source}`)
}

export const REGEXES = {
	ANY_WHITESPACE,
	EXTRACT_PRONOUN_REFERENT,
	EXTRACT_LOOKUP_TERM,
	HAS_POSSESSIVE,
	HAS_SENSE,
	EXTRACT_STEM_AND_SENSE,
	SENTENCE_ENDING_PUNCTUATION,
	CLAUSE_ENDING_PUNCTUATION,
	OPENING_BRACKET,
	OPENING_PAREN,
	CLOSING_PAREN,
	FORWARD_SLASH,
	PIPE,
	TOKEN_END_BOUNDARY,
	WORD_START_CHAR,
	WORD_CHAR,
	STARTS_LOWERCASE,
	OR,
}
