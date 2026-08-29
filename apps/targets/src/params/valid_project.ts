import type { ParamMatcher } from '@sveltejs/kit'
import { TARGET_PROJECTS } from '@tabitha/types/target'

export const match: ParamMatcher = (param: string): boolean => (TARGET_PROJECTS as readonly string[]).includes(param)
