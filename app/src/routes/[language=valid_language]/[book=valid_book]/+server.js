// https://kit.svelte.dev/docs/routing#server
import { error, json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { language, book } }) {
	const sql = `
		SELECT DISTINCT chapter
		FROM ${language}
		WHERE book = ?
		ORDER BY chapter
	`
	/** @type {import('@cloudflare/workers-types').D1Result<ChapterResult>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(book).all()

	if (results.length) {
		return json(results.map(({ chapter }) => chapter))
	}

	return error(404, 'Not found')
}
