// https://playwright.dev/docs/writing-tests#first-test
// @ts-check
import { test, expect } from '@playwright/test'

test('smoke test for search results of "love"', async ({ page }) => {
	await page.goto('/')

	// https://playwright.dev/docs/api/class-page#page-locator
	const search = await page.locator('search')
	const search_input = await search.locator('input[type="search"]')
	const search_button = await search.getByRole('button')

	// https://playwright.dev/docs/api/class-locator#locator-fill
	search_input.fill('love')
	search_button.click()

	const results = await page
		.locator('header')
		.filter({ hasText: 'results' })
		.locator('strong')

	await expect(results).not.toHaveText('0')
})