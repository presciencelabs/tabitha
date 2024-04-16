import { expect } from 'vitest'
import { MESSAGE_TYPE, get_message_type } from './parser/token'

/**
 * @param {Token?} token 
 * @param {string} message 
 */
export function expect_error(token, message) {
	expect(token?.messages).toContainEqual({ ...MESSAGE_TYPE.ERROR, message })
}
/**
 * @param {Token?} token 
 * @param {MessageLabel} label 
 * @param {string} message 
 */
export function expect_message(token, label, message) {
	expect(token?.messages).toContainEqual({ ...get_message_type(label), message })
}

/**
 * @param {Token?} token 
 * @param {RegExp} regex 
 */
export function expect_error_to_match(token, regex) {
	expect(token?.messages[0].label).toBe('error')
	expect(token?.messages[0].message).toMatch(regex)
}

/**
 * @param {Token?} token 
 * @param {MessageLabel} message_type 
 * @param {RegExp} regex 
 */
export function expect_message_to_match(token, message_type, regex) {
	expect(token?.messages[0].label).toBe(message_type)
	expect(token?.messages[0].message).toMatch(regex)
}

/**
 * 
 * @param {Token?} token 
 */
export function expect_no_message(token) {
	expect(token?.messages.length).toBe(0)
}

// TODO move other create_X() functions in here (rename as X_for_test())