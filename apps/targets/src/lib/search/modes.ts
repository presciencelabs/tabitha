/**
 * The modes `/[project]/search` can run, as they appear in its `mode` query param.
 *
 * Named for which corpus is searched, not how -- both modes support quoted exact-phrase syntax,
 * so "phrase" never actually distinguished them.
 */
export type SearchMode = 'target' | 'reference'

export const MODE = {
	/** Our own drafted translation text, stored in this project's Targets database. */
	DEFAULT: 'target',
	/** A published reference Bible version, fetched live via API.Bible. */
	REFERENCE: 'reference',
} as const satisfies Record<string, SearchMode>
