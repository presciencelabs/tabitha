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

	return json(results)
}
