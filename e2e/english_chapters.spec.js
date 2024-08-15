// https://playwright.dev/docs/writing-tests#first-test
// @ts-check
import { test, expect } from '@playwright/test'

// https://playwright.dev/docs/test-fixtures#built-in-fixtures
test('get all chapters of 1 Samuel (English project)', async ({ request }) => {
	const response = await request.get('/English/1 Samuel')

	const chapters = await response.json()

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-have-length
	expect(chapters).toHaveLength(31)

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-contain-2
	expect(chapters).toContain(21)
})

test('Ensure book parameter is valid', async ({ request }) => {
	expect(await request.get('/4')).not.toBeOK()
})
