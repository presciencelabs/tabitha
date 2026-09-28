import { themes, to_daisyui_theme } from './themes'

export const THEME_KEY = 'theme'

const daisyui_theme_by_stored_name = Object.fromEntries(themes.map(theme => [theme, to_daisyui_theme(theme)]))

// Runs as a blocking <head> script, before first paint, so a saved theme is on <html> before any
// content renders -- the server can't read localStorage, so it can't render the theme itself.
// With no valid saved theme it leaves <html> alone, and daisyUI's --prefersdark handles the OS default.
export const theme_script = `(() => {
	try {
		const themes = ${JSON.stringify(daisyui_theme_by_stored_name)}
		const stored = localStorage.getItem(${JSON.stringify(THEME_KEY)})
		if (stored && Object.hasOwn(themes, stored)) document.documentElement.dataset.theme = themes[stored]
	} catch {}
})()`

export const theme_script_tag = `<script>${theme_script}</script>`
