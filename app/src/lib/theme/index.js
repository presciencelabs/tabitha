import Selector from './Selector.svelte'
import {writable} from 'svelte/store'

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

	current_theme.set(theme)

	console.info('theme set:', html.getAttribute('data-theme'))
}

const current_theme = writable('')

// prettier-ignore
export {
	current_theme,
	initialize_theme,
	Selector,
	set_theme,
}
