// https://kit.svelte.dev/docs/routing#server
import { error, json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { project } }) {
	const sql = `
		SELECT DISTINCT book
		FROM Text
		WHERE project = ?
	`

	try {
		/** @type {import('@cloudflare/workers-types').D1Result<BookResult>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
		const { results } = await db.prepare(sql).bind(project).all()

		return json(results.map(({ book }) => book))
	} catch {
		return error(404, 'Not found')
	}
}