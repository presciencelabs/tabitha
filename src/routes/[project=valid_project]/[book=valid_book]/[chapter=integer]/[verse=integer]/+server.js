// https://kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { project, book, chapter, verse } }) {
	const sql = `
		SELECT DISTINCT text, audience
		FROM Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
			AND verse = ?
	`
	/** @type {import('@cloudflare/workers-types').D1Result<TextResult>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(project, book, chapter, verse).all()

	const ideal_sql = `
		SELECT DISTINCT ideal_text AS text, audience
		FROM Ideal_Text
		WHERE project = ?
			AND book = ?
			AND chapter = ?
			AND verse = ?
	`
	/** @type {import('@cloudflare/workers-types').D1Result<TextResult>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results: ideal_results } = await db.prepare(ideal_sql).bind(project, book, chapter, verse).all()

	for (const result of results) {
		const ideal_result = ideal_results.find(ir => ir.audience === result.audience)
		if (ideal_result) {
			result.ideal = ideal_result.text
		}
	}

	return json(results)
}
