import { themes, type Theme } from './themes'

const THEME_KEY = 'tabitha-theme'

function get_initial_theme(): string {
	if (typeof window === 'undefined') return 'nord'
	const stored = localStorage.getItem(THEME_KEY)
	if (stored && themes.includes(stored as Theme)) return stored
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dracula' : 'nord'
}

class ThemeState {
	current = $state(get_initial_theme())

	set(newTheme: string) {
		this.current = newTheme
		if (typeof window !== 'undefined') {
			localStorage.setItem(THEME_KEY, newTheme)
			document.documentElement.setAttribute('data-theme', newTheme)
		}
	}

	init() {
		if (typeof window !== 'undefined') {
			const active = this.current
			document.documentElement.setAttribute('data-theme', active)
		}
	}
}

export const theme_state = new ThemeState()
export function set_theme(theme: string) {
	theme_state.set(theme)
}
