// @ts-check
import { test, expect } from '@playwright/test'

test('a minted session reaches protected pages without going through Google OAuth', async ({ page }) => {
	const response = await page.goto('/protected/changes')

	expect(response?.status()).toBe(200)
	await expect(page.getByRole('heading', { name: 'Changes' })).toBeVisible()
})
