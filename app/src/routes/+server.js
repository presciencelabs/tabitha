// https://kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db } }) {
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	const sql = `
		SELECT name
		FROM sqlite_master
		WHERE type = 'table'
			AND name NOT LIKE '!_%' ESCAPE '!' -- sometimes, CF puts tables in the database, e.g., _cf_KV
		ORDER BY name
	`

	/** @type {import('@cloudflare/workers-types').D1Result<LanguageResult>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).all()

	return json(results.map(({ name }) => name))
}
