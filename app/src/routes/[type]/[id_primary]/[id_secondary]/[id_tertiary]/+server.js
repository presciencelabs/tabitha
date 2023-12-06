// https://kit.svelte.dev/docs/routing#server
import {json} from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({locals: {db}, params: {type, id_primary, id_secondary, id_tertiary}}) {
	const sql = `
		SELECT *
		FROM Sources
		WHERE type = ?
			AND id_primary = ?
			AND id_secondary = ?
			AND id_tertiary = ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<Source>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const result = await db.prepare(sql).bind(type, id_primary, id_secondary, id_tertiary).first()

	return json(result)
}
