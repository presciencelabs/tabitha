// https://kit.svelte.dev/docs/routing#server
import { transform_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { type, id_primary, id_secondary, id_tertiary } }) {
	const sql = `
		SELECT *
		FROM Sources
		WHERE type = ?
			AND id_primary = ?
			AND id_secondary = ?
			AND id_tertiary = ?
	`

	/** @type {Source|null} */
	const result = await db.prepare(sql).bind(type, id_primary, id_secondary, id_tertiary).first()

	if (result) {
		result.parsed_semantic_encoding = await transform_semantic_encoding(result.semantic_encoding, db)
	}

	return json(result)
}
