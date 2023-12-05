// https://kit.svelte.dev/docs/routing#server
import {json} from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({locals: {db}, params: {type}}) {
	const sql = `
		SELECT DISTINCT id_primary
		FROM Sources
		WHERE type = ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<PrimaryId>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const {results} = await db.prepare(sql).bind(type).all()

	return json(results)
}
