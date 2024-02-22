import daisyui from 'daisyui'
import daisy_themes from 'daisyui/src/theming/themes'
import themes from './src/lib/theme/themes'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte}'],

	plugins: [
		typography,
		daisyui,
	],

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
