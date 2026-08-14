import { error, json, type RequestHandler } from '@sveltejs/kit'
import type { ChapterResult } from '$lib/types'

export const GET: RequestHandler = async ({ locals: { db }, params: { project, book } }) => {
	const sql = `
		SELECT DISTINCT chapter
		FROM Text
		WHERE project = ? AND book = ?
		ORDER BY chapter
	`
	const { results } = await db.prepare(sql).bind(project, book).all<ChapterResult>()

	if (results.length) {
		return json(results.map(({ chapter }) => chapter))
	}

	return error(404, 'Not found')
}
