import themes from './src/lib/theme/themes'
import daisy_themes from 'daisyui/src/theming/themes'


/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte}'],

	plugins: [require('@tailwindcss/typography'), require('daisyui')],

	/** @type {import('daisyui').Config} */
	daisyui: {
		themes: [
			...themes,
			{
				reformation: daisy_themes['halloween'],
			},
		],
	},
}
