/** @type {TokenType} */
const ERROR = 'Error'

/** @type {TokenType} */
const PUNCTUATION = 'Punctuation'

/** @type {TokenType} */
const NOTE = 'Note'

/** @type {TokenType} */
const FUNCTION_WORD = 'FunctionWord'

/** @type {TokenType} */
const LOOKUP_WORD = 'Word'

/** @type {TokenType} */
const PAIRING = 'Pairing'

export const TOKEN_TYPE = {
    ERROR,
    PUNCTUATION,
    NOTE,
    FUNCTION_WORD,
    LOOKUP_WORD,
    PAIRING,
}

/**
 * 
 * @param {string} token 
 * @param {TokenType} type 
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.message=''] 
 * @param {string} [other_data.lookup_term=''] 
 * @param {Token?} [other_data.pairing_left=null] 
 * @param {Token?} [other_data.pairing_right=null] 
 */
export function create_token(token, type, {message='', lookup_term='', pairing_left=null, pairing_right=null}={}) {
    return {
        token,
        type,
        message,
        lookup_term,
        pairing_left,
        pairing_right,
    }
}

/**
 * 
 * @param {string} token 
 * @param {string} message 
 * @returns {Token}
 */
export function create_error_token(token, message) {
    return create_token(token, TOKEN_TYPE.ERROR, { message })
}
