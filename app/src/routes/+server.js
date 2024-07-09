// https://kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db } }) {
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	const sql = `
		SELECT DISTINCT project
		FROM Lexicon
	`

	/** @type {import('@cloudflare/workers-types').D1Result<ProjectResult>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).all()

	return json(results.map(({ project }) => project))
}
