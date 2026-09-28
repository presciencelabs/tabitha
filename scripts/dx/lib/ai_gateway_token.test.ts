import { describe, expect, it } from 'bun:test'
import { classify_gateway_response } from './ai_gateway_token'

describe('classify_gateway_response', () => {
	it('treats Vertex rejecting the empty probe body as a valid token', () => {
		expect(classify_gateway_response(400)).toBe('valid')
	})

	it('treats the gateway refusing authentication as a rejected token', () => {
		expect(classify_gateway_response(401)).toBe('rejected')
		expect(classify_gateway_response(403)).toBe('rejected')
	})

	it('flags anything else as unexpected rather than guessing', () => {
		expect(classify_gateway_response(200)).toBe('unexpected')
		expect(classify_gateway_response(500)).toBe('unexpected')
	})
})
