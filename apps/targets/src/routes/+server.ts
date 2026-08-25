import { json, type RequestHandler } from '@sveltejs/kit'
import type { ProjectResult } from '$lib/types'

export async function GET({ locals: { db } }: Parameters<RequestHandler>[0]) {
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
