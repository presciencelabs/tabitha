import { expect, test } from '@playwright/test'

test('generating notes for a verse fetches real encoding/text data, runs it through the flag/trigger pipeline, and renders AI-produced notes', async ({ page }) => {
	// Genesis 1:1 is the app's default verse. Wait for the network to settle so Svelte has
	// hydrated (wired up the button's click handler) before interacting with it.
	await page.goto('/', { waitUntil: 'networkidle' })

	await page.getByRole('button', { name: 'Get notes' }).click()

	const heading = page.getByRole('heading', { name: 'Notes for Genesis 1:1' })
	await expect(heading).toBeVisible()
	await expect(page.getByText('Loading...')).toBeHidden()

	// The mocked AI response (see e2e/support/mock_ai_gateway.mjs) echoes a note back for every
	// trigger the real flag-extraction/weighting/trigger pipeline selected for this verse, so this
	// confirms the whole pipeline -- real source/target lookups, flag extraction, weighting, and
	// the AI round trip -- ran end-to-end rather than erroring out.
	await expect(page.getByText('[e2e mock] meaning for trigger', { exact: false }).first()).toBeVisible()
})
