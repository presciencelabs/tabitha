import { transform_semantic_encoding, transform_target_encoding } from '$lib/encoding/semantic_encoding'
import { simplify_encoding } from '$lib/encoding/simplify'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { EncodingEntity } from '@tabitha/types'

export const GET: RequestHandler = async ({ locals: { db }, url: { searchParams } }) => {
	const raw_encoding = searchParams.get('raw_encoding') ?? ''
	const simple = searchParams.get('simple') === 'true'
	const project = searchParams.get('project') ?? ''
	
	const is_target = raw_encoding.includes('~\\z1')
	const parsed_encoding: EncodingEntity[] = is_target
		? await transform_target_encoding({ db, semantic_encoding: raw_encoding, project })
		: await transform_semantic_encoding({ db, semantic_encoding: raw_encoding })

	return simple
		? json({ parsed_encoding: simplify_encoding(parsed_encoding) })
		: json({ parsed_encoding })
}
