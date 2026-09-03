// @ts-check
import { expect, test } from '@playwright/test'

test('search bar parses reference and redirects to verse page', async ({ page }) => {
	await page.goto('/')

	const searchInput = page.locator('#ref_search')
	await searchInput.fill('Genesis 1:1')
	await page.locator('form[role="search"] button[type="submit"]').click()

	await expect(page).toHaveURL(/\/Bible\/Genesis\/1\/1$/)
})

test('clicking next verse button navigates to next verse', async ({ page }) => {
	await page.goto('/Bible/Genesis/1/1')

	const nextButton = page.locator('a[title*="Genesis 1:2"]')
	await nextButton.click()

	await expect(page).toHaveURL(/\/Bible\/Genesis\/1\/2$/)
})

test('status lookup page renders status overview', async ({ page }) => {
	await page.goto('/lookup/status/Bible')

	const heading = page.locator('h2:has-text("Encoding Status")')
	await expect(heading).toBeVisible()

	const chapterDetailsLink = page.locator('a[href*="/lookup/status/Bible/Genesis"]').first()
	await chapterDetailsLink.click()

	await expect(page).toHaveURL(/\/lookup\/status\/Bible\/Genesis$/)
})

test.skip('selecting word concept opens Constituent Inspector and loads ontology details', async ({ page }) => {
	// Mock external ontology API to keep E2E tests fast, offline-capable, and deterministic
	await page.route('**/search?*', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{
					stem: 'God',
					sense: 'A',
					part_of_speech: 'Noun',
					level: '1',
					gloss: 'creator God',
					categories: ['Noun'],
					status: 'in ontology',
				},
			]),
		})
	})

	await page.goto('/Bible/Genesis/1/1')
	await page.waitForLoadState('networkidle')

	const conceptBadge = page.locator('div[role="button"]', { hasText: 'God' }).first()
	await conceptBadge.click()

	const sidebarHeading = page.locator('h3:has-text("Constituent Inspector")')
	await expect(sidebarHeading).toBeVisible()

	// TODO open the concept details before the 'View in Ontology' link

	// Verify ontology data table content loaded cleanly from mocked API
	const viewInOntologyLink = page.locator('a:has-text("View in Ontology")').first()
	await expect(viewInOntologyLink).toBeVisible()
})
