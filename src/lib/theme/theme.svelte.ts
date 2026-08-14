class ThemeState {
	current = $state('')

	initialize() {
		if (typeof window === 'undefined') return
		const saved_theme = localStorage.getItem('theme')
		if (saved_theme) {
			this.set(saved_theme)
			return
		}
		const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches
		this.set(dark_mode ? 'dark' : 'light')
	}

	set(theme: string) {
		if (typeof document === 'undefined') return
		const html = document.documentElement
		localStorage.setItem('theme', theme)
		html.setAttribute('data-theme', theme)
		this.current = theme
		console.info('theme set:', html.getAttribute('data-theme'))
	}
}

export const theme_state = new ThemeState()
