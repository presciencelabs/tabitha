import { load_source_feature_map } from '$lib/encoding/features'
import { GRAMMAR_ONLY_FEATURES } from '$lib/encoding/lookups'

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { db } }) {
	const features = await load_source_feature_map(db)

	const features_to_show = new Map([...features.entries()].map(([category, features]) => {
		const filtered_features = features.filter(({ name }) => !name.startsWith('Spare') && !GRAMMAR_ONLY_FEATURES.includes(`${category}-${name}`))
		return [category, filtered_features]
	}))

	return {
		features: features_to_show,
	}
}