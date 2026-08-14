import { error, json, type RequestHandler } from '@sveltejs/kit'
import type { BookResult } from '$lib/types'

export const GET: RequestHandler = async ({ locals: { db }, params: { project } }) => {
	const sql = `
		SELECT DISTINCT book
		FROM Text
		WHERE project = ?
	`

	try {
		const { results } = await db.prepare(sql).bind(project).all<BookResult>()

		return json(results.map(({ book }) => book))
	} catch {
		return error(404, 'Not found')
	}
}
