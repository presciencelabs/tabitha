// https://kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary } }) {
	const sql = `
		SELECT DISTINCT id_secondary
		FROM Sources
		WHERE type = ?
			AND id_primary = ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<SecondaryId>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(type, id_primary).all()

	return json(results)
}
