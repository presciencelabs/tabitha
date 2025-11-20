import type { D1Database } from '@cloudflare/workers-types'

type AndTerm = string
type OrTerm = {
	and_terms: AndTerm[]
}
type ParsedSearchQuery = {
	or_terms: OrTerm[]
}

export function parse_search_query(q: string): ParsedSearchQuery {
	const normalized_q = normalize_wildcards(q)

	const or_strings = normalized_q.split('|')
	const or_terms = or_strings.map(or_term => ({
		and_terms: [...or_term.matchAll(/\s*"(.+?)"|(\S+)\s*/g)]
			.map(m => m[1] || m[2])
			.map(term => term.trim())
			.filter(term => term.length > 0),
	}))
	return { or_terms }
}

export async function search_text(db: D1Database, project: string, parsed_q: ParsedSearchQuery) {

	const query_conditions = parsed_q.or_terms.map(or_term => {
		const and_conditions = or_term.and_terms.map(() => 'text LIKE ?').join(' AND ')
		return `(${and_conditions})`
	}).join(' OR ')

	const query = `
		SELECT text, audience, book, chapter, verse
		FROM Text
		WHERE project = ? AND (${query_conditions})
	`

	// Remove wildcards around each query term, as they will be added back in by default
	const q_values = parsed_q.or_terms.flatMap(or_term => or_term.and_terms.map(term => term.replaceAll(/^%|%$/g, '')).map(term => `%${term}%`))

	const { results: matches } = await db.prepare(query).bind(project, ...q_values).all<DbTextResult>()

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
	return possible_wildard.replaceAll(/[*#]/g, '%')
}