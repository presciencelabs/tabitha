import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { db }, params: { project }, url: { searchParams } }) {
	// targets.tabitha.bible/English/lookup/features
	// targets.tabitha.bible/English/lookup/features?category=Noun
	// TODO: targets.tabitha.bible/English/lookup/features?category=Noun&position=2
	// TODO: targets.tabitha.bible/English/lookup/features?category=Noun&position=2&code=P
	/** @type {CategoryName} */
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

	/** @type {import('@cloudflare/workers-types').D1Result<DbRowFeature>} */
	const { results: lexical_features } = await db.prepare(lexical_sql).bind(project).all()

	/** @type {import('@cloudflare/workers-types').D1Result<DbRowFeature>} */
	const { results: source_features } = await db.prepare(source_sql).bind(project).all()

	return json({
		source: transform(source_features, category),
		lexical: transform(lexical_features, category),
	})
}

/**
 * @param {DbRowFeature[]} features 
 * @param {CategoryName} category
 * @returns {ApiFeature[]}
 */
function transform(features, category) {
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
