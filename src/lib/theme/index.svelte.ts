import Selector from './Selector.svelte'

class ThemeState {
	current = $state('')

	set(theme: string) {
		if (typeof window === 'undefined') return

		const html = document.documentElement
		localStorage.setItem('theme', theme)
		html.setAttribute('data-theme', theme)
		this.current = theme
		console.info('theme set:', html.getAttribute('data-theme'))
	}

	initialize() {
		if (typeof window === 'undefined') return

		const saved_theme = localStorage.getItem('theme')
		if (saved_theme) {
			return this.set(saved_theme)
		}

		const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches
		this.set(dark_mode ? 'dark' : 'light')
	}
}

export const theme_state = new ThemeState()

export function initialize_theme() {
	theme_state.initialize()
}

export function set_theme(theme: string) {
	theme_state.set(theme)
}

export { Selector }
