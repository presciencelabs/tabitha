import { describe, expect, it } from 'vitest'
import { cached_json } from './response_helpers'

describe('server/response_helpers', () => {
	describe('cached_json', () => {
		it('returns a Response object with JSON body', async () => {
			const data = { message: 'hello', count: 42 }
			const response = cached_json(data)

			expect(response).toBeInstanceOf(Response)
			expect(response.status).toBe(200)

			const body = await response.json()
			expect(body).toEqual(data)
		})

		it('sets default Cache-Control header (3 hours = 10800s)', () => {
			const response = cached_json({ ok: true })
			expect(response.headers.get('cache-control')).toBe('max-age=10800')
		})

		it('allows custom max-age duration', () => {
			const response = cached_json({ ok: true }, 3600)
			expect(response.headers.get('cache-control')).toBe('max-age=3600')
		})
	})
})
