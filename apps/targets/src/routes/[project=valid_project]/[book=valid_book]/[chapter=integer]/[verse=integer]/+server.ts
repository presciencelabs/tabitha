import { json, type RequestHandler } from '@sveltejs/kit'
import type { TextResult } from '$lib/types'

export async function GET({ locals: { db }, params: { project, book, chapter, verse } }: Parameters<RequestHandler>[0]) {
	const sql = `
		SELECT DISTINCT text, audience
		FROM Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
			AND verse = ?
	`
	const { results } = await db.prepare(sql).bind(project, book, chapter, verse).all<TextResult>()

	const ideal_sql = `
		SELECT DISTINCT ideal_text AS text, audience
		FROM Ideal_Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
			AND verse = ?
	`
	let ideal_results: TextResult[] = []
	try {
		const res = await db.prepare(ideal_sql).bind(project, book, chapter, verse).all<TextResult>()
		ideal_results = res.results ?? []
	} catch {
		// Ideal_Text table optional or unpopulated in local D1 schema
	}

	for (const result of results) {
		const ideal_result = ideal_results.find(ir => ir.audience === result.audience)
		if (ideal_result) {
			result.ideal = ideal_result.text
		}
	}

	return json(results)
}
