import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param: string): boolean => /^[a-zA-Z]+$/.test(param)
