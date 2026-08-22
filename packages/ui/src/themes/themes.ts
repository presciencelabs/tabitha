export const themes = [
	'light',
	'dark',
	'CanIL',
	'CanIL Dark',
	'cupcake',
	'nord',
	'dracula',
	'acid',
	'aqua',
	'autumn',
	'black',
	'bumblebee',
	'business',
	'caramellatte',
	'cmyk',
	'coffee',
	'corporate',
	'cyberpunk',
	'dim',
	'vespers',
	'emerald',
	'fantasy',
	'forest',
	'garden',
	'reformation',
	'lemonade',
	'lofi',
	'luxury',
	'night',
	'pastel',
	'retro',
	'silk',
	'sunset',
	'synthwave',
	'valentine',
	'winter',
	'wireframe',
] as const

export type Theme = (typeof themes)[number]

// daisyUI only ships its themes under their built-in names. 'reformation' and 'vespers'
// are displayed to users and persisted to storage under those names, but render using
// daisyUI's built-in 'halloween' and 'abyss' themes, which app.css must still declare
// by their real names.
const daisyui_theme_names: Partial<Record<Theme, string>> = {
	reformation: 'halloween',
	vespers: 'abyss',
	'CanIL Dark': 'CanILDark',
}

export function to_daisyui_theme(theme: string): string {
	return daisyui_theme_names[theme as Theme] ?? theme
}

export default themes
