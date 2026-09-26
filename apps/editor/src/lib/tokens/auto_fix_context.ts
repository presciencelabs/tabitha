import { createContext } from 'svelte'
import type { CheckerAutoFix } from '@tabitha/types'

export const [get_remove_auto_fix, set_remove_auto_fix] = createContext<(auto_fix: CheckerAutoFix) => void>()
