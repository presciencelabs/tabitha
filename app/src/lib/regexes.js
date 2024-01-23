// useful references:
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
//
// playground:  https://regexr.com
// visualizer:  https://jex.im/regulex

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#s
const ANY_WHITESPACE = /\s+/
const NON_WHITESPACE_BEFORE_UNDERSCORE = /\S_/
const UNACCEPTABLE_CHAR_BEFORE_OPENING_BRACKET = /[^\s[]\[/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#w
// e.g., "Paul was very upset/distressed [because Paul saw throughout Athens many objects [that the people of that city thought [were gods]]]."
// matches, Paul, was very ...
// but not, upset/distressed, [, ], or .
const IS_A_WORD = /^\w+$/
const ANY_WORD_EXCLUDE_OPEN_PAREN = /\b(\w+)\b(?!\()/
const IS_PUNCTUATION = /^\W$/
const IS_PRONOUN = /^\w+\(\w+\)$/
const EXTRACT_PRONOUN_REFERENT = /^\w+\((\w+)\)$/

// catches (imp) but not you(Paul)
const IS_SIGNAL_WORD = /^\(.*\)$/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class
const OPENING_OR_CLOSING_BRACKET = /[[\]]/
const OPENING_OR_CLOSING_BRACKET_G = /[[\]]/g

// ^(\W*?): group 1 => any non-word characters at the beginning of the string (if they appear) (and non-greedy match in case of '[(')
// ([\w/()-]*): group 2 => any word characters (including characters below) (if they appear)
//			'/': alternate forms
//			'(' or ')': signal words or pronoun referents
//			"'": possessives, .e.g, Israelites'
//			'-': hyphentated signal words
// (\W*)$: group 3 => same as group 1 but at the end of the string (if they appear)
const PUNCTUATION_GROUPING = /^(\W*?)([\w/()'-]*)(\W*)$/

const POSSESSIVE = /'s?/

export const REGEXES = {
	ANY_WHITESPACE,
	ANY_WORD_EXCLUDE_OPEN_PAREN,
	EXTRACT_PRONOUN_REFERENT,
	IS_A_WORD,
	IS_PRONOUN,
	IS_PUNCTUATION,
	IS_SIGNAL_WORD,
	UNACCEPTABLE_CHAR_BEFORE_OPENING_BRACKET,
	NON_WHITESPACE_BEFORE_UNDERSCORE,
	OPENING_OR_CLOSING_BRACKET,
	OPENING_OR_CLOSING_BRACKET_G,
	POSSESSIVE,
	PUNCTUATION_GROUPING,
}
