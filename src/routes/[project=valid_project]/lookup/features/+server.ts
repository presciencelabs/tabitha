import { json, type RequestHandler } from '@sveltejs/kit'
import type { ApiFeature, DbRowFeature } from '$lib/types'

export const GET: RequestHandler = async ({ locals: { db }, params: { project }, url: { searchParams } }) => {
	const category = searchParams.get('category')?.toLowerCase() ?? ''

	const lexical_sql = `
		SELECT *
		FROM Lexical_Features
		WHERE project = ?
	`
	const source_sql = `
		SELECT *
		FROM Source_Features
		WHERE project = ?
	`

	const { results: lexical_features } = await db.prepare(lexical_sql).bind(project).all<DbRowFeature>()
	const { results: source_features } = await db.prepare(source_sql).bind(project).all<DbRowFeature>()

	return json({
		source: transform(source_features ?? [], category),
		lexical: transform(lexical_features ?? [], category),
	})
}

function transform(features: DbRowFeature[], category: string): ApiFeature[] {
	return features
		.filter(f => !category.length || f.category.toLowerCase() === category)
		.map(({ category, feature, position, code, value }) => ({
			category,
			feature,
			position,
			code,
			value,
		}))
}
