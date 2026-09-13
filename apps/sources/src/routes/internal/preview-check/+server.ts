import { json } from '@sveltejs/kit'

// TEMPORARY -- verifies PR #122's cross-app preview-to-preview infrastructure end-to-end
// (originally motivated by PR #120's targets->sources phrase-search work). Delete before merge.
export async function GET() {
	return json({ marker: 'pr-122-preview-test' })
}
