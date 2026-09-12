/**
 * The modes `/[project]/search` can run, as they appear in its `mode` query param.
 */
export type SearchMode = 'text' | 'phrase'

export const MODE = {
	DEFAULT: 'text',
	PHRASE: 'phrase',
} as const satisfies Record<string, SearchMode>
