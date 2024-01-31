const MISSING_OPENING_PAREN = 'Missing an opening parenthesis.'
const MISSING_CLOSING_PAREN = 'Missing a closing parenthesis.'

const MISSING_OPENING_BRACKET = 'Missing an opening parenthesis.'
const MISSING_CLOSING_BRACKET = 'Missing a closing parenthesis.'
const NO_SPACE_BEFORE_OPENING_BRACKET = 'Missing a space before [.'

const INVALID_PAIRING_SYNTAX = 'Pairings should have the form simple/complex, e.g., follower/disciple.'
const NO_SPACE_AFTER_CLAUSE_NOTATION = 'Must include a space after a clause notation.'
const UNRECOGNIZED_CLAUSE_NOTATION = 'This clause notation is not recognized.'
const NO_SPACE_BEFORE_UNDERSCORE = 'Notes notation should have a space before the underscore, e.g., ⎕_implicit.'
const UNRECOGNIZED_CHAR = 'Unrecognized character.'

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
    NO_SPACE_AFTER_CLAUSE_NOTATION,
    UNRECOGNIZED_CLAUSE_NOTATION,
    NO_SPACE_BEFORE_UNDERSCORE,
    INVALID_PAIRING_SYNTAX,
    UNRECOGNIZED_CHAR,
    INVALID_TOKEN_END,
}