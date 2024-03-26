// https://playwright.dev/docs/writing-tests#first-test
// @ts-check
import { test, expect } from '@playwright/test'

// https://playwright.dev/docs/test-fixtures#built-in-fixtures
test('get all verses in 1 Samuel:21 (English project)', async ({ request }) => {
	const response = await request.get('/English/1 Samuel/21')

	const verses = await response.json()

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-have-length
	expect(verses).toHaveLength(15)

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-contain-2
	expect(verses).toContain(12)
})

test('Ensure chapter parameter is valid', async ({ request }) => {
	expect(await request.get('/English/1 Samuel/abc')).not.toBeOK()
})
