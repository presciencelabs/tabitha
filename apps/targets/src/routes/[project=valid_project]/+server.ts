import { error, json, type RequestHandler } from '@sveltejs/kit'
import type { BookResult } from '$lib/types'

export async function GET({ locals: { db }, params: { project } }: Parameters<RequestHandler>[0]) {
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
