import {expect, test} from '@playwright/test'

test('index page has expected heading', async ({page}) => {
	await page.goto('/')

	// https://playwright.dev/docs/api/class-page#page-get-by-role
	await expect(page.getByRole('heading', {name: 'Ontology'})).toBeVisible()
})
