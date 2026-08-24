import { get_source_features } from '$lib/encoding/features'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { ApiFeature, DbFeature } from '@tabitha/types'

export async function GET({ locals: { db }, url: { searchParams } }: Parameters<RequestHandler>[0]) {
	const category = searchParams.get('category')?.toLowerCase() ?? ''

	const features = await get_source_features(db)
	const filtered_features = category.length ? features.filter(f => f.category.toLowerCase() === category) : features

	return json({
		source: transform(filtered_features),
	})
}

function transform(features: DbFeature[]): ApiFeature[] {
	return features.map(({ category, feature, position, code, value, example }) => ({
		category,
		feature,
		position,
		code,
		value,
		example,
	}))
}
