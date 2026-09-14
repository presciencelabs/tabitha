import { themes, type Theme } from './themes'

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
		}
	}
}

export const theme_state = new ThemeState()
export function set_theme(theme: string) {
	theme_state.set(theme)
}
