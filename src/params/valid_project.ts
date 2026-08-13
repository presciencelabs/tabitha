import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param: string): boolean => {
	return /^[a-zA-Z]+$/.test(param)
}
