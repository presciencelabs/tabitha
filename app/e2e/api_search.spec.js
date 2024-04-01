// https://playwright.dev/docs/writing-tests#first-test
// @ts-check
import { test, expect } from '@playwright/test'

// https://playwright.dev/docs/test-fixtures#built-in-fixtures
test('check API contract, e.g., /?q=love', async ({ request }) => {
	const response = await request.get('/?q=love')
	const matches = await response.json()

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-contain-equal
	expect(matches).toContainEqual({
		id: expect.any(Number),
		stem: 'love',
		sense: expect.any(String),
		part_of_speech: expect.any(String),
		level: expect.any(Number),
		gloss: expect.any(String),
		categorization: expect.any(String),
	})
})

test('ensure search is case-insensitive, e.g., /?q=Love', async ({ request }) => {
	const lowercase_matches = await (await request.get('/?q=love')).json()
	const uppercase_matches = await (await request.get('/?q=Love')).json()

	expect(lowercase_matches).toEqual(uppercase_matches)
})

test("ensure missing parameter is handled properly, e.g., /, /?, /?q, /?q=, /?q=''", async ({ request }) => {
	const bad_requests = [
		'/',
		'/?',
		'/?q',
		'/?q=',
		"/?q=''",
	]

	for (const bad_request of bad_requests) {
		const response = await request.get(bad_request)
		const matches = await response.json()

		expect(matches).toEqual([])
	}
})

test('ensure query with no matches is handled properly, e.g., /?q=supercalifragilisticexpialidocious', async ({ request }) => {
	const response = await request.get('/?q=supercalifragilisticexpialidocious')
	const matches = await response.json()

	expect(matches).toEqual([])
})