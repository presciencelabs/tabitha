import { json, type RequestHandler } from '@sveltejs/kit'
import type { ProjectResult } from '$lib/types'

export const GET: RequestHandler = async ({ locals: { db } }) => {
	const sql = `
		SELECT DISTINCT project
		FROM Lexicon
	`

	try {
		const { results } = await db.prepare(sql).all<ProjectResult>()
		return json(results?.map(({ project }) => project) ?? [])
	} catch {
		return json([])
	}
}
