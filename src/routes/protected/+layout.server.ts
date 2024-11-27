import type { LayoutServerLoad } from './$types'

export const load = (async event => {
	await event.parent() // ensures authz is handled in one place, the /routes/+layout.server.ts
}) satisfies LayoutServerLoad
