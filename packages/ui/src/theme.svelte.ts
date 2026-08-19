import { themes, to_daisyui_theme, type Theme } from './themes'

const THEME_KEY = 'theme'

function get_initial_theme(): string {
	if (typeof window === 'undefined') return 'light'
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
			document.documentElement.setAttribute('data-theme', to_daisyui_theme(new_theme))
		}
	}
}

export const theme_state = new ThemeState()
export function set_theme(theme: string) {
	theme_state.set(theme)
}

// Apply the resolved theme as soon as this module loads in the browser, so every
// consuming app gets the data-theme attribute set for free just by importing
// theme_state, set_theme, ThemeSelector, or Footer — no per-app wiring required.
if (typeof document !== 'undefined') {
	document.documentElement.setAttribute('data-theme', to_daisyui_theme(theme_state.current))
}
