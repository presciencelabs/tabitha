import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
import { json } from '@sveltejs/kit'

// TEMPORARY -- verifies PR #122's cross-app preview-to-preview infrastructure end-to-end. Delete
// before merge.
export const prerender = false

export async function GET({ fetch }) {
	const res = await fetch(`${PUBLIC_SOURCES_API_HOST}/internal/preview-check`)
	const data = await res.json()
	return json({ called: PUBLIC_SOURCES_API_HOST, ...data })
}
