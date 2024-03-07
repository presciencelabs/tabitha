// https://kit.svelte.dev/docs/routing#server
import { error, json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { language, book, chapter, verse } }) {
	const sql = `
		SELECT DISTINCT text
		FROM ${language}
		WHERE book = ?
			AND chapter = ?
			AND verse = ?
	`
	/** @type {TextResult|null} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const result = await db.prepare(sql).bind(book, chapter, verse).first()

	if (!result) {
		return error(404, 'Not found')
	}

	return json(result.text)
}
