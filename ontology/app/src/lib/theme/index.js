import Selector from './Selector.svelte'

function initialize_theme() {
	const saved_theme = localStorage.getItem('theme')

	if (saved_theme) return set_theme(saved_theme)

	const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches

	set_theme(dark_mode ? 'dark' : 'light')
}

/** @param {string} theme themes configured in ontology/app/tailwind.config.js */
function set_theme(theme) {
	const html = document.documentElement

	localStorage.setItem('theme', theme)

	html.setAttribute('data-theme', theme)

	console.info('theme set:', html.getAttribute('data-theme'))
}

// prettier-ignore
export {
	Selector,
	initialize_theme,
	set_theme,
}
