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

// catches (imp) but not you(Paul)
const IS_SIGNAL_WORD = /^\(.*\)$/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class
const OPENING_OR_CLOSING_BRACKET = /[[\]]/
const OPENING_OR_CLOSING_BRACKET_G = /[[\]]/g

// ^(\W*): group 1 => any non-word characters at the beginning of the string (if they appear)
// ([\w/()]*): group 2 => any word characters (including '/', '(' or ')') (if they appear)
// (\W*)$: group 3 => same as group 1 but at the end of the string (if they appear)
const PUNCTUATION_GROUPING = /^(\W*)([\w/()]*)(\W*)$/

export const REGEXES = {
	ANY_WHITESPACE,
	ANY_WORD_EXCLUDE_OPEN_PAREN,
	IS_A_WORD,
	IS_PUNCTUATION,
	IS_SIGNAL_WORD,
	UNACCEPTABLE_CHAR_BEFORE_OPENING_BRACKET,
	NON_WHITESPACE_BEFORE_UNDERSCORE,
	OPENING_OR_CLOSING_BRACKET,
	OPENING_OR_CLOSING_BRACKET_G,
	PUNCTUATION_GROUPING,
}
