import { error, json, type RequestHandler } from '@sveltejs/kit'
import type { VerseResult } from '$lib/types'

export const GET: RequestHandler = async ({ locals: { db }, params: { project, book, chapter } }) => {
	const sql = `
		SELECT DISTINCT verse
		FROM Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
		ORDER BY verse
	`
	const { results } = await db.prepare(sql).bind(project, book, chapter).all<VerseResult>()

	if (results.length) {
		return json(results.map(({ verse }) => verse))
	}

	return error(404, 'Not found')
}
