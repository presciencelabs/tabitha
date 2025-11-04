import type { D1Database } from '@cloudflare/workers-types'

export async function search_text(db: D1Database, project: string, q: string) {
	const normalized_q = normalize_wildcards(q)

	const query = `
		SELECT text, audience, book, chapter, verse
		FROM Text
		WHERE project = ? AND text LIKE ?
	`

	// Remove wildcards around the query, as they will be added back in by default
	const trimmed_q = normalized_q.replace(/^%|%$/g, '')

	const { results: matches } = await db.prepare(query).bind(project, `%${trimmed_q}%`).all<DbTextResult>()

	return transform(matches)

	/**
	 * @param {DbTextResult[]} matches
	 * @returns {SearchTextResult[]}
	 */
	function transform(matches: DbTextResult[]): SearchTextResult[] {
		return Map.groupBy(matches, m => `${m.book}:${m.chapter}:${m.verse}`).values()
			.map(group => ({
				reference: {
					type: 'Bible',
					id_primary: group[0].book,
					id_secondary: group[0].chapter,
					id_tertiary: group[0].verse
				},
				texts: group.map(({ text, audience }) => ({ text, audience }))
			})).toArray()
	}
}

/**
 * @param {string} possible_wildard a string that may contain wildcards, e.g., '*' or '#' or '%'
 * @returns {string} SQL-ready string, i.e., `%` for wildcards
 */
function normalize_wildcards(possible_wildard: string): string {
	return possible_wildard.replace(/[*#]/g, '%')
}