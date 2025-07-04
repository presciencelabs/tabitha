// https://playwright.dev/docs/writing-tests#first-test
// @ts-check
import { test, expect } from '@playwright/test'

// https://playwright.dev/docs/test-fixtures#built-in-fixtures
test('get all generated text from in 1 Samuel 21:1 (English project)', async ({ request }) => {
	const response = await request.get('/English/1 Samuel/21/1')

	const texts_by_audience = await response.json()
	const serialized_texts = JSON.stringify(texts_by_audience, null, 2)

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-be-truthy
	expect(serialized_texts).toBeTruthy()

	// https://playwright.dev/docs/api/class-genericassertions#generic-assertions-to-contain-1
	expect(serialized_texts).toContain('David')
})

test('Ensure verse parameter is valid', async ({ request }) => {
	expect(await request.get('/English/1 Samuel/21/abc')).not.toBeOK()
})
