// https://kit.svelte.dev/docs/routing#server
import { transform_semantic_encoding, transform_target_encoding } from '$lib/encoding/semantic_encoding'
import { simplify_encoding } from '$lib/encoding/simplify'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, url: { searchParams } }) {
	/** @type {string} */
	const raw_encoding = searchParams.get('raw_encoding') ?? ''
	/** @type {boolean} */
	const simple = searchParams.get('simple') === 'true'
	/** @type {string} */
	const project = searchParams.get('project') ?? ''
	
	const is_target = raw_encoding.includes('~\\z1')
	/** @type {EncodingEntity[]} */
	const parsed_encoding = is_target
		? await transform_target_encoding(db, raw_encoding, project)
		: await transform_semantic_encoding(db, raw_encoding)

	return simple
		? json({ parsed_encoding: simplify_encoding(parsed_encoding) })
		: json({ parsed_encoding })
}
