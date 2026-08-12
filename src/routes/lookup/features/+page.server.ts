import { is_used_in_source, load_source_feature_map } from '$lib/encoding/features'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { db } }) => {
	const features = await load_source_feature_map(db)

	const features_to_show = new Map([...features.entries()].map(([category, features]) => {
		const filtered_features = features.filter(is_used_in_source(category))
		return [category, filtered_features]
	}))

	return {
		features: features_to_show,
	}
}
