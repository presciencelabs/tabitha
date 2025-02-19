// https://kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db } }) {
	const sql = `
		SELECT DISTINCT type
		FROM Sources
	`

	/** @type {import('@cloudflare/workers-types').D1Result<SourceType>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).all()

	return json(results)
}
