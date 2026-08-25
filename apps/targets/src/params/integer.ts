import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param: string): boolean => /^[0-9]+$/.test(param)
