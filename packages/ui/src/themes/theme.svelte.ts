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
			// 1. Create a style block to instantly kill ALL transitions/animations
			const css = document.createElement('style')
			css.appendChild(
				document.createTextNode(
					`* { 
					-webkit-transition: none !important; 
					-moz-transition: none !important; 
					-o-transition: none !important; 
					-ms-transition: none !important; 
					transition: none !important; 
				}`,
				),
			)
			document.head.appendChild(css)

			// 2. Change the daisyUI theme attribute
			localStorage.setItem(THEME_KEY, new_theme)
			document.documentElement.dataset.theme = to_daisyui_theme(new_theme)
			
			// 3. Force a DOM repaint so the browser renders the new theme colors instantly
			window.getComputedStyle(css).getPropertyValue('opacity')

			// 4. Remove the style block to re-enable your 3-second row animations safely
			document.head.removeChild(css)
		}
	}
}

export const theme_state = new ThemeState()
export function set_theme(theme: string) {
	theme_state.set(theme)
}
