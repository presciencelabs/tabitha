import { get_next_reference, get_previous_reference } from '$lib/data/navigation'
import { get_source_data } from '$lib/data/read'
import { transform_semantic_encoding } from '$lib/encoding/semantic_encoding'
import { error } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { db }, params: { type, id_primary, id_secondary, id_tertiary } }) {
	const reference = { type, id_primary, id_secondary, id_tertiary }
	const source = await get_source_data(db, reference)

	if (!source) {
		error(404, 'Unknown source reference.')
	}
	reference.id_primary = source.id_primary	// get the proper capitalization

	const parsed_encoding = await transform_semantic_encoding(db, source.semantic_encoding)
	const previous = await get_previous_reference(db, reference)
	const next = await get_next_reference(db, reference)

	return {
		source,
		parsed_encoding,
		nav_data: {
			previous,
			next,
		},
	}
}