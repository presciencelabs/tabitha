import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param: string): boolean => {
	// covers numbered books, e.g., 1 Chronicles, 3 John
	return /^[a-zA-Z0-3 ]+$/.test(param)
}
