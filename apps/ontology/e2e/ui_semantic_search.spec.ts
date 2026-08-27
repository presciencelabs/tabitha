import { expect, test } from '@playwright/test'

test('semantic search renders related concepts from the mocked AI response', async ({ page }) => {
	// A query with no stem/gloss matches of its own (see api_search.spec.ts's use of the same
	// string for the same reason), so any rendered results can only have come from
	// find_related_concepts()'s AI round trip, not the plain stem-search fallback.
	await page.goto('/?q=supercalifragilisticexpialidocious&category=all&scope=semantic')

	const results_badge = page.locator('header em.badge')
	await expect(results_badge).toBeVisible()
	await expect(results_badge).toContainText('results')

	const cards = page.locator('article.card')
	await expect(cards.first()).toBeVisible()
})
