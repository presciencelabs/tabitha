import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { apply_pending_changes } from '$lib/server/changes/changes'

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized')
	}

	try {
		const { count, failed, version } = await apply_pending_changes(locals.db_ontology)
		return json({
			success: true,
			count,
			failed,
			version,
			timestamp: new Date().toISOString(),
		})
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err)
		console.error('Failed to apply pending changes:', message)
		throw error(500, `Failed to apply pending changes: ${message}`)
	}
}