import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'
import daisy_themes from 'daisyui/src/theming/themes'
import type { Config } from 'tailwindcss'
import themes from './src/lib/theme/themes'

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
	],

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
} satisfies Config
