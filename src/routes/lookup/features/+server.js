import { get_source_features } from '$lib/encoding/features'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, url: { searchParams } }) {
	// sources.tabitha.bible/lookup/features
	// sources.tabitha.bible/lookup/features?category=Noun
	// TODO: sources.tabitha.bible/lookup/features?category=Noun&position=2
	// TODO: sources.tabitha.bible/lookup/features?category=Noun&position=2&code=P
	/** @type {CategoryName} */
	const category = searchParams.get('category')?.toLowerCase() ?? ''

	const features = await get_source_features(db)
	const filtered_features = category.length ? features.filter(f => f.category.toLowerCase() === category) : features

	return json({
		source: transform(filtered_features),
	})
}

/**
 * @param {DbFeature[]} features 
 * @returns {ApiFeature[]}
 */
function transform(features) {
	return features.map(({ category, feature, position, code, value, example }) => ({
		category,
		feature,
		position,
		code,
		value,
		example,
	}))
}