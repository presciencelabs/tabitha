const MISSING_OPENING_PAREN = 'Missing an opening parenthesis.'
const MISSING_CLOSING_PAREN = 'Missing a closing parenthesis.'

const MISSING_OPENING_BRACKET = 'Missing an opening bracket in the following sentence.'
const MISSING_CLOSING_BRACKET = 'Missing a closing bracket in the previous sentence.'
const NO_SPACE_BEFORE_OPENING_BRACKET = 'Missing a space before [.'

const INVALID_PAIRING_SYNTAX = 'Pairings should have the form simple/complex, e.g., follower/disciple.'
const UNRECOGNIZED_CLAUSE_NOTATION = 'This clause notation is not recognized.'
const NO_SPACE_BEFORE_UNDERSCORE = 'Notes notation should have a space before the underscore, e.g., ⎕_implicit.'
const UNRECOGNIZED_CHAR = 'Unrecognized character.'

const MISSING_PERIOD = 'Each verse must end in a period (or ? and !).'
const FIRST_WORD_NOT_CAPITALIZED = 'The first word of each sentence should be capitalized.'
const PAIRING_DIFFERENT_PARTS_OF_SPEECH = 'Cannot pair words of different parts of speech'

const WORD_LEVEL_TOO_HIGH = 'Word must be a level 0 or 1'
const WORD_LEVEL_TOO_LOW = 'Word must be a level 2 or 3'
const AMBIGUOUS_LEVEL = 'This word has multiple senses and ambiguous complexity. Consider including the sense (e.g. son-A).'

/**
 *
 * @param {string} text
 */
const INVALID_TOKEN_END = function(text) {
	return `${text} must be followed by a space or punctuation.`
}

export const ERRORS = {
	MISSING_OPENING_PAREN,
	MISSING_CLOSING_PAREN,
	MISSING_OPENING_BRACKET,
	MISSING_CLOSING_BRACKET,
	NO_SPACE_BEFORE_OPENING_BRACKET,
	MISSING_PERIOD,
	FIRST_WORD_NOT_CAPITALIZED,
	UNRECOGNIZED_CLAUSE_NOTATION,
	NO_SPACE_BEFORE_UNDERSCORE,
	INVALID_PAIRING_SYNTAX,
	UNRECOGNIZED_CHAR,
	INVALID_TOKEN_END,
	WORD_LEVEL_TOO_HIGH,
	WORD_LEVEL_TOO_LOW,
	AMBIGUOUS_LEVEL,
	PAIRING_DIFFERENT_PARTS_OF_SPEECH,
}