export const CLAUSE_NOTATIONS = [
	'(alternate-1)',
	'(alternate-2)',
	'(alternate-3)',
	'(alternate-4)',
	'(alternate-5)',
	'(begin-comment)',
	'(begin-poetry)',
	'(blank-line)',
	'(comment-begin)',
	'(comment-end)',
	'(complex)',
	'(dynamic)',
	'(end-comment)',
	'(end-poetry)',
	'(footnote)',
	'(imp)',
	'(implicit-background)',
	'(implicit-cultural)',
	'(implicit-historical)',
	'(implicit-situational)',
	'(implicit-subaction)',
	'(jussive)',
	'(literal)',
	'(literalunits)',
	'(modernunits)',
	'(norhetorical)',
	'(paragraph)',
	'(poetry-begin)',
	'(poetry-end)',
	'(primary)',
	'(rhetorical)',
	'(simple)',
	'(statement)',
	'(suggestivelets)',
	'(title)',
	'(yesrhetorical)',
]

const notation_name = (notation: string): string => notation.slice(1, -1).toLowerCase().replaceAll('_', '-')

export function suggest_clause_notations(notation: string): string[] {
	const entered_name = notation_name(notation)
	if (!entered_name) return []

	const exact_match = CLAUSE_NOTATIONS.find(known => notation_name(known) === entered_name)
	if (exact_match) return [exact_match]

	return CLAUSE_NOTATIONS.filter(known => {
		const known_name = notation_name(known)
		return known_name.startsWith(entered_name) || entered_name.startsWith(known_name)
	})
}
