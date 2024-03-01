// https://kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary, id_secondary } }) {
	const sql = `
		SELECT DISTINCT id_tertiary
		FROM Sources
		WHERE type = ?
			AND id_primary = ?
			AND id_secondary = ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<TertiaryId>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const { results } = await db.prepare(sql).bind(type, id_primary, id_secondary).all()

	return json(results)
}
