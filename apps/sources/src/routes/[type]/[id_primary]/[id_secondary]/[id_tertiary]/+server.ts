import { get_source_data } from '$lib/data/read'
import { transform_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { Reference } from '@tabitha/types'

export const GET: RequestHandler = async ({ locals: { db }, params: { type, id_primary, id_secondary, id_tertiary } }) => {
	const reference: Reference = { type, id_primary, id_secondary, id_tertiary }
	const source = await get_source_data(db, reference)

	if (!source) {
		error(404, 'Unknown source reference.')
	}
	
	const parsed_semantic_encoding = await transform_semantic_encoding(db, source.semantic_encoding)
	return json({
		...source,
		parsed_semantic_encoding,
	})
}
