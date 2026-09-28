import { themes, to_daisyui_theme, type Theme } from './themes'
import { THEME_KEY } from './theme_script'

// Undefined on the server, so no theme-controller radio renders checked: a checked radio's
// :has() selector outranks <html data-theme>, and would override the pre-paint theme script.
function get_initial_theme(): string | undefined {
	if (typeof window === 'undefined') return undefined
	const stored = localStorage.getItem(THEME_KEY)
	if (stored && themes.includes(stored as Theme)) return stored
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

class ThemeState {
	current = $state(get_initial_theme())

	set(new_theme: string) {
		this.current = new_theme
		if (typeof window !== 'undefined') {
			localStorage.setItem(THEME_KEY, new_theme)
			document.documentElement.dataset.theme = to_daisyui_theme(new_theme)
		}
	}
}

export const theme_state = new ThemeState()
export function set_theme(theme: string) {
	theme_state.set(theme)
}
