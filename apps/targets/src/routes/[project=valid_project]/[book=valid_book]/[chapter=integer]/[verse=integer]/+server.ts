import { json, type RequestHandler } from '@sveltejs/kit'
import type { DbRowText } from '$lib/types'
import type { TargetTextResult } from '@tabitha/types'

type QueryTextResult = Pick<DbRowText, 'text' | 'audience'>

export async function GET({ locals: { db }, params: { project, book, chapter, verse } }: Parameters<RequestHandler>[0]) {
	const sql = `
		SELECT DISTINCT text, audience
		FROM Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
			AND verse = ?
	`
	const { results: text_results } = await db.prepare(sql).bind(project, book, chapter, verse).all<QueryTextResult>()

	const ideal_sql = `
		SELECT DISTINCT ideal_text AS text, audience
		FROM Ideal_Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
			AND verse = ?
	`
	let ideal_results: QueryTextResult[] = []
	try {
		const res = await db.prepare(ideal_sql).bind(project, book, chapter, verse).all<QueryTextResult>()
		ideal_results = res.results ?? []
	} catch {
		// Ideal_Text table optional or unpopulated in local D1 schema
	}

	const results = merge_ideal_text_results({ text_results, ideal_results })

	return json(results)
}

function merge_ideal_text_results({ text_results, ideal_results }: { text_results: QueryTextResult[], ideal_results: QueryTextResult[] }): TargetTextResult[] {
	return text_results.map(result => ({
		...result,
		ideal: ideal_results.find(ir => ir.audience === result.audience)?.text,
	}))
}
