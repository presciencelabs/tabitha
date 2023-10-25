/** @type {import('./$types').PageServerLoad} */
export async function load({url: {searchParams}, platform}) {
	if (!platform?.env.DB) {
		throw new Error(`Missing DB, looked for it in platform: ${JSON.stringify(platform)}`)
	}
	const DB = platform.env.DB

	const query = searchParams.get('q') ?? ''

	/** @type {Concept[]} */
	let matches = []

	switch (query) {
		case '':
			break

		case '*':
			matches = await get_all_concepts(DB)
			break

		default:
			matches = await get_some_concepts(DB)(query)
	}

	return {
		matches,
	}
}

/**
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {Promise<Concept[]>}
 */
async function get_all_concepts(db) {
	const sql = `
		SELECT *
		FROM Concepts
	`
	/** @type {import('@cloudflare/workers-types').D1Result<DbRow>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const {results} = await db.prepare(sql).all()

	return normalize(results)
}

/**
 * case-insensitive, wilcard on both sides of search term, i.e., the filter
 *
 * @param {import('@cloudflare/workers-types').D1Database} db
 *
 * @returns {ConceptFilterFunction}
 * */
const get_some_concepts = db => async filter => {
	// https://www.sqlite.org/lang_expr.html#the_like_glob_regexp_match_and_extract_operators
	// https://developers.cloudflare.com/d1/platform/client-api/#searching-with-like
	// https://developers.cloudflare.com/d1/platform/client-api/#parameter-binding
	const sql = `
		SELECT *
		FROM Concepts
		WHERE roots LIKE ?
	`

	/** @type {import('@cloudflare/workers-types').D1Result<DbRow>} https://developers.cloudflare.com/d1/platform/client-api/#return-object */
	const {results} = await db.prepare(sql).bind(`%${filter}%`).all()

	return normalize(results)
}

/**
 * @param {DbRow[]} matches_from_db
 *
 * @returns {Concept[]}
 * */
function normalize(matches_from_db) {
	return matches_from_db.map(transform)

	/**
	 * @param {DbRow} match_from_db
	 *
	 * @returns {Concept}
	 */
	function transform(match_from_db) {
		return {
			...match_from_db,

			examples: transform_examples(match_from_db.examples),
			exhaustive_examples: transform_exhaustive_examples(match_from_db.exhaustive_examples),
			occurrences: Number(match_from_db.occurrences),
		}
	}
}

/**
 * @param {string} examples_from_db "4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.\n4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.\n4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.\n"
 *
 * @returns {Example[]}
 * */
function transform_examples(examples_from_db) {
	const encoded_examples = examples_from_db.split('\n').filter(field => !!field)
	// 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	// 4,17,2,2|(NPp|Xerxes|)|(VP|search|)|(NPP|(APA|beautiful|)|virgin|)|~Xerxes searched for a beautiful virgin.
	// 4,40,6,29|(NPp|clothes|(NPN|of|flower|)|)|(VP|be|)|(APP|beautiful|(NPN|clothes|(NPN|of|Solomon|)|)|)|~The flower's clothers are more beautiful than Solomon's clothes.

	return encoded_examples.map(decode)

	/**
	 * @param {string} encoded_example 4,2,2,2|(NPp|baby|)|(VP|be|)|(APP|beautiful|)|~The baby was beautiful.
	 *
	 * @returns {Example}
	 * */
	function decode(encoded_example) {
		const encoded_references = encoded_example.match(/^(\d+,?)*/)?.[0] || '' // 4,2,2,2

		return {
			references: encoded_references.split(','),
			semantic_representation: encoded_example.match(/(\|.*\|)~/)?.[1] || '', // |(NPp|baby|)|(VP|be|)|(APP|beautiful|)|
			sentence: encoded_example.match(/~(.*\.)/)?.[1] || '', // The baby was beautiful.
		}
	}
}

/**
 * @param {string} exhaustive_examples_from_db '4|41|15|36|N|||wineA||\n4|41|15|36|N|||wineA||\n'
 *
 * @returns
 * */
function transform_exhaustive_examples(exhaustive_examples_from_db) {
	const encoded_exhaustive_examples = exhaustive_examples_from_db.split('\n').filter(field => !!field)
	// 4|41|15|36|N|||wineA||
	// 4|41|15|36|N|||wineA||

	return encoded_exhaustive_examples.map(decode)

	/**
	 * @param {string} encoded_exhaustive_example 4|41|15|36|N|||wineA||
	 *
	 * @returns
	 * */
	function decode(encoded_exhaustive_example) {
		//TODO: need to learn what each of those fields mean.
		return encoded_exhaustive_example
	}
}
