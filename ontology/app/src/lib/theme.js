export function initialize_theme() {
	const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches

	// https://daisyui.com/docs/themes/
	// themes configured in ontology/app/tailwind.config.js

	const html = document.documentElement
	html.setAttribute('data-theme', dark_mode ? 'dark' : 'light')

	console.info('theme set:', html.getAttribute('data-theme'))
}