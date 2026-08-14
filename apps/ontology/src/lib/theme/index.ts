import Selector from './Selector.svelte'
import { theme_state } from './theme.svelte'

export function initialize_theme(): void {
	theme_state.initialize()
}

export function set_theme(theme: string): void {
	theme_state.set(theme)
}

export { Selector, theme_state }
