import { expect, test } from '@playwright/test'

test('home page loads and renders the site header', async ({ page }) => {
	const response = await page.goto('/')
	expect(response?.ok()).toBe(true)

	await expect(page.getByRole('banner').getByRole('link', { name: 'TaBiThA' })).toBeVisible()
})
